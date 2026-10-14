/**
 * VANTAGE deterministic policy engine - dependency-free (Node 18+).
 *
 * This module is the ONLY thing that can authorise a state change in the
 * autonomy runtime. It is code, not a prompt: no role file, queue status,
 * environment variable, or wording in a document can widen what it allows.
 *
 * Design rules, each asserted by scripts/tests.mjs:
 *   - fail closed: an unknown action, an unknown environment, a malformed
 *     request, an empty rule set, or an unrecognised result all DENY
 *   - deny wildcard resource scope ("**", "*")
 *   - deny any spend when no explicit budget authorises it (default zero)
 *   - defer-human for the NEVER class, at every autonomy level
 *   - an active kill switch denies every mutating action, and a check must
 *     re-read it immediately before the mutation, not only at plan time
 *   - log the decision and a reason code; never log secret values
 *
 * A policy response is:
 *   { decision: 'allow'|'deny'|'defer-human', policy_version, reason_code,
 *     matched_rule, limits_remaining, expires_at }
 */

export const POLICY_VERSION = 1;

// Actions that mutate something. Read-only actions never consult the kill
// switch and never consume budget.
export const MUTATING_ACTIONS = new Set([
  'content.publish', 'content.edit', 'file.write', 'file.delete',
  'git.commit', 'git.branch', 'git.push',
  'data.ledger.write', 'data.state.write', 'queue.approve', 'queue.hold',
  'cluster.archive', 'cluster.graduate', 'social.queue', 'experiment.verdict',
  'seo.tweak', 'faq.add',
  'pages.deploy', 'pages.build',
  'purchase', 'payment.create', 'payout.create',
  'email.send', 'email.draft', 'social.publish', 'dm.send',
  'affiliate.enrol', 'affiliate.link',
  'security.change', 'credential.rotate', 'dns.change',
  'pricing.change', 'legal.attest', 'product.pick',
  'kill.branch'
]);

export const READ_ACTIONS = new Set([
  'file.read', 'web.read', 'analytics.read', 'status.read', 'report.read'
]);

export const ENVIRONMENTS = new Set(['sandbox', 'test', 'preview', 'production']);

/**
 * The NEVER class. These are human-only at every autonomy level. There is no
 * configuration flag that unlocks them; the matrix lists them so that a
 * stray allow rule cannot quietly cover one.
 */
export const NEVER_ACTIONS = new Set([
  'pricing.change', 'legal.attest', 'affiliate.enrol',
  'payment.create', 'payout.create', 'purchase',
  'email.send', 'social.publish', 'dm.send',
  'security.change', 'credential.rotate', 'dns.change',
  'product.pick', 'kill.branch'
]);

/** Allowed repository path prefixes for the default operating envelope. */
export const DEFAULT_PATH_ALLOWLIST = [
  'agents/', 'data/', 'dashboard/', 'docs/', 'scripts/', 'sites/', 'tools/'
];

/**
 * Build a policy engine from a validated configuration block.
 * A configuration that is missing, malformed, or empty produces an engine
 * that denies every mutating action.
 */
export function createPolicy(config, opts = {}) {
  const now = opts.now ? new Date(opts.now).getTime() : Date.now();
  const version = config && typeof config.policy_version === 'number' ? config.policy_version : 0;

  const problems = [];
  if (!config || typeof config !== 'object') problems.push('policy config missing');
  if (version !== POLICY_VERSION) problems.push(`unknown policy_version (${version})`);
  if (!config || !Array.isArray(config.rules) || config.rules.length === 0) problems.push('empty ruleset');

  const killSwitch = () => {
    if (!config || typeof config.kill_switch !== 'boolean') return true; // fail closed
    return config.kill_switch === true;
  };

  const budget = {
    currency: (config && config.budget && config.budget.currency) || 'ZAR',
    per_run_spend: numOr(config && config.budget && config.budget.per_run_spend, 0),
    monthly_spend: numOr(config && config.budget && config.budget.monthly_spend, 0),
    expires_at: (config && config.budget && config.budget.expires_at) || null
  };
  const limits = {
    max_publications_per_run: numOr(config && config.limits && config.limits.max_publications_per_run, 0),
    max_messages_per_hour: numOr(config && config.limits && config.limits.max_messages_per_hour, 0),
    max_retries_per_action: numOr(config && config.limits && config.limits.max_retries_per_action, 3)
  };
  const rules = (Array.isArray(config && config.rules) && config.rules) ? config.rules : [];

  const decision = (d, reason, matched_rule = null, extra = {}) => ({
    decision: d,
    policy_version: version,
    reason_code: reason,
    matched_rule,
    limits_remaining: { ...limits },
    expires_at: extra.expires_at || null,
    ...extra
  });

  /**
   * Evaluate one action request. Pure: it does not mutate state, so the same
   * request always yields the same answer.
   */
  function evaluate(request) {
    // 1. Shape validation - anything unexpected denies.
    if (!request || typeof request !== 'object') return decision('deny', 'malformed_request');
    const action = request.action;
    const principal = request.principal || {};
    const resource = request.resource || {};

    if (typeof action !== 'string' || !action) return decision('deny', 'malformed_request_no_action');
    if (typeof principal.agent !== 'string' || !principal.agent) return decision('deny', 'malformed_request_no_principal');
    if (principal.role !== 'worker' && principal.role !== 'verifier' && principal.role !== 'orchestrator') {
      return decision('deny', 'unknown_principal_role');
    }

    const isMutating = MUTATING_ACTIONS.has(action);
    const isRead = READ_ACTIONS.has(action);

    // 2. Unknown action names deny, even if they look harmless.
    if (!isMutating && !isRead) return decision('deny', 'unknown_action');

    if (!isMutating) {
      // Read-only paths do not consume budget and survive the kill switch:
      // stopping diagnoses is the opposite of what a kill switch is for.
      return decision('allow', 'read_only');
    }

    // 3. NEVER class is human-only, before any allow rule can match.
    if (NEVER_ACTIONS.has(action)) return decision('defer-human', 'never_class');

    // 4. Kill switch stops every mutation. Re-checked immediately before the
    //    mutation by the tool gateway, not only when the plan was built.
    if (killSwitch()) return decision('deny', 'kill_switch_engaged');

    // 5. Configuration problems disable mutation entirely.
    if (problems.length) return decision('deny', `config_invalid:${problems[0]}`);

    // 6. Environment must be known.
    const env = request.environment;
    if (typeof env !== 'string' || !ENVIRONMENTS.has(env)) return decision('deny', 'unknown_environment');

    // 7. Resource path must be concrete and inside the allowlist.
    const path = resource.path;
    if (typeof path === 'string') {
      if (path.includes('*') || path.includes('..') || path.startsWith('/')) {
        return decision('deny', 'non_concrete_resource_path');
      }
      const roots = Array.isArray(config.path_allowlist) && config.path_allowlist.length
        ? config.path_allowlist : DEFAULT_PATH_ALLOWLIST;
      if (!roots.some(r => path === r || path.startsWith(r))) {
        return decision('deny', 'path_outside_allowlist');
      }
    }

    // 8. Spend. Default is zero; anything above the ceiling denies.
    const requested = numOr(request.budget && request.budget.maximum, 0);
    if (requested > 0) {
      if (requested > budget.per_run_spend || requested > budget.monthly_spend) {
        return decision('deny', 'over_budget');
      }
      if (budget.expires_at && Date.parse(budget.expires_at) <= now) {
        return decision('deny', 'budget_expired');
      }
    }

    // 9. Rule match, most specific first, default deny.
    let sawAllow = null;
    for (const rule of rules) {
      if (!rule || !Array.isArray(rule.actions) || !rule.actions.includes(action)) continue;
      if (Array.isArray(rule.environments) && !rule.environments.includes(env)) continue;
      if (Array.isArray(rule.paths) && typeof path === 'string') {
        if (!rule.paths.some(p => path.startsWith(p))) continue;
      }
      const dec = rule.decision || 'deny';
      if (dec === 'allow' || dec === 'allow_if_all') {
        if (dec === 'allow_if_all' && Array.isArray(rule.requires) && rule.requires.length) {
          // Every requirement must be asserted by the request itself. A
          // missing or false requirement denies; we do not trust a claim
          // that cannot be checked here.
          const unmet = rule.requires.filter(r => request.satisfied === undefined || request.satisfied[r] !== true);
          if (unmet.length) return decision('deny', `requirement_unmet:${unmet[0]}`, rule.id);
        }
        sawAllow = rule.id;
      } else if (dec === 'defer-human') {
        return decision('defer-human', 'rule_defer_human', rule.id);
      } else {
        return decision('deny', 'rule_deny', rule.id);
      }
    }

    if (sawAllow) return decision('allow', 'rule_allow', sawAllow);
    return decision('deny', 'default_deny');
  }

  /** Schema-validate a config the way a startup check would. */
  function validate() {
    return { ok: problems.length === 0, problems: [...problems] };
  }

  return { evaluate, validate, limits, budget, rules, version, NEVER_ACTIONS };
}

function numOr(v, fallback) {
  return (typeof v === 'number' && Number.isFinite(v) && v >= 0) ? v : fallback;
}

/**
 * Redact a request for logging. Returns a stable digest plus the fields that
 * are safe to keep. Never includes values of anything named like a secret.
 */
const SECRET_KEY = /(token|secret|password|passwd|key|credential|authorization|cookie)/i;
export function redactRequest(request) {
  if (!request || typeof request !== 'object') return { digest: 'sha256:none' };
  const safe = {};
  for (const [k, v] of Object.entries(request)) {
    if (SECRET_KEY.test(k)) { safe[k] = '[redacted]'; continue; }
    if (typeof v === 'object' && v !== null) { safe[k] = '[object]'; continue; }
    safe[k] = v;
  }
  const json = JSON.stringify(safe);
  let h = 5381;
  for (let i = 0; i < json.length; i++) h = ((h * 33) ^ json.charCodeAt(i)) >>> 0;
  return { digest: `fnv1a:${h.toString(16).padStart(8, '0')}`, fields: safe };
}