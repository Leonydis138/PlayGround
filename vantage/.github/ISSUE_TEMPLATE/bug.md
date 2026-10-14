name: Bug report
description: Something in the engine is broken or wrong
body:
  - type: textarea
    id: what
    attributes:
      label: What happened
      description: What you expected vs what actually happened.
    validations:
      required: true
  - type: textarea
    id: where
    attributes:
      label: Where
      description: Script/agent/file/URL involved.
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Evidence
      description: Log output, dashboard panel, or failing gate output. NEVER paste secrets or API tokens.
    validations:
      required: false