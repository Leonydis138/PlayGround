name: Decision request
description: Something needing a CEO judgment call (routes to the decision queue)
body:
  - type: textarea
    id: decision
    attributes:
      label: The decision
      description: What must be decided, and what it costs to get it wrong.
    validations:
      required: true
  - type: textarea
    id: options
    attributes:
      label: Options considered
      description: Each option with its honest tradeoff. Mark your recommendation.
    validations:
      required: true
  - type: checkboxes
    id: never-class
    attributes:
      label: NEVER class check
      options:
        - label: This is NOT in the NEVER class (legal, pricing, affiliate-signup, payment/payout, outbound-send, security, product-pick) - those go to the CEO directly, not here
          required: true