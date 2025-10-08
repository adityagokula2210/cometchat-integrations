/**
 * Tripetto Form Definitions
 * Store your form definitions exported from Tripetto Studio
 */

// Your Chronious Workflow form from Tripetto Studio
const chroniousWorkflow = {
  "name": "Chronious Workflow",
  "prologue": {
    "title": "Hi, I'm Ava — a Virtual Care Assistant from your ChroniusCare team.\n​\nI'm here to ask a few short questions so we can get your message to the right person and make sure your care team has what they need to help you as soon as possible."
  },
  "sections": [
    {
      "id": "babbdeece12d20c56da0e7a805228d7e84dd1401984fd6fc8bfda642f92d2ce4",
      "name": "Initial Message",
      "alias": "initial message",
      "nodes": [
        {
          "id": "bf5be5f7b7fcba52ceee9d9ea36e10a86026160f18201918d54093514b13e967",
          "name": "What do you need help with today?\n\nIf you have more than one item to discuss, let's start with the first one, and then we can come back for the others -- ensuring each question gets to the right member of your care team.",
          "nameVisible": true,
          "slots": [
            {
              "id": "8561baa955cac1d3d4a5e3d5340df8e445eb0929d50b37a3250ec895ac4fc5d5",
              "type": "string",
              "kind": "static",
              "reference": "choice",
              "label": "Choice"
            }
          ],
          "block": {
            "type": "@tripetto/block-multiple-choice",
            "version": "7.0.1",
            "choices": [
              {
                "id": "1c232afb1bdae19dc06c45d6d9c5689c074732c4b6888399177c33dcf98bdc9e",
                "name": "Schedule an Appointment"
              },
              {
                "id": "a28242bf35b75bbdb51c1b0dd76e4fd8871296bb2f47bd21ac30c3adf6fce8f5",
                "name": "Ask a Medical Question"
              },
              {
                "id": "0df6dc0c0aed684faa2d2cca96a7efc471524920f5124e23426426449395a0f7",
                "name": "Refill a Medication"
              },
              {
                "id": "25cd9c7c828e5eafdcf4324de03372c13e08977f4ee543075627c7c112ad456e",
                "name": "Ask about a Test Result"
              },
              {
                "id": "d25f2f343d645a51653a1e1ee256f193e0ae2b0190345538480287d86cdc551a",
                "name": "Give my Care Team an Update"
              }
            ]
          }
        }
      ],
      "branches": [
        {
          "id": "3b804f7f43ff0e9d4d4c25d1a98728e6f42f65cc09eaefa2cd62db170b810b7c",
          "conditions": [
            {
              "id": "19828ab35fa9fbd2f8efa9de57674587a3670ba89d5841efc043a34a325be00e",
              "block": {
                "choice": "1c232afb1bdae19dc06c45d6d9c5689c074732c4b6888399177c33dcf98bdc9e",
                "type": "@tripetto/block-multiple-choice",
                "version": "7.0.1",
                "node": "bf5be5f7b7fcba52ceee9d9ea36e10a86026160f18201918d54093514b13e967",
                "slot": "8561baa955cac1d3d4a5e3d5340df8e445eb0929d50b37a3250ec895ac4fc5d5"
              }
            }
          ]
        },
        {
          "id": "62e42985143b7fd4da0f1cda120750064009a2cd99c4a7b9c72cc71b4fe10b25",
          "sections": [
            {
              "id": "17d62c00fc3eb7a5b0f637b663e85d8cc89719d1d8bb87665e44c07b01c197e9",
              "nodes": [
                {
                  "id": "1aa627785ea83941c223507c9408f8e56f4b7fd79f9bc0de1a00a1a5941b311d",
                  "name": "Hi there",
                  "nameVisible": true
                }
              ]
            }
          ],
          "conditions": [
            {
              "id": "a9f4eb1a1397fe46e453a59706f029b73a48f505f2d6ae9a715c39e2b9020870",
              "block": {
                "choice": "d25f2f343d645a51653a1e1ee256f193e0ae2b0190345538480287d86cdc551a",
                "type": "@tripetto/block-multiple-choice",
                "version": "7.0.1",
                "node": "bf5be5f7b7fcba52ceee9d9ea36e10a86026160f18201918d54093514b13e967",
                "slot": "8561baa955cac1d3d4a5e3d5340df8e445eb0929d50b37a3250ec895ac4fc5d5"
              }
            }
          ],
          "jump": "abort"
        }
      ]
    },
    {
      "id": "c18f109cf99ae4213b75efbf61e3d69ef1b3623306ae670c40592d9a48cb0f9d",
      "nodes": [
        {
          "id": "560d016aab25e11eee9b90729fe63b5af103e2797f0283c4794102ddf187a3db",
          "name": "Sure. Let us connect you to a consultant",
          "nameVisible": true
        }
      ]
    }
  ],
  "builder": {
    "name": "@tripetto/builder",
    "version": "6.2.1"
  }
};

// Form registry with metadata
const forms = {
  'chronious-care': {
    id: 'chronious-care',
    name: 'ChroniusCare Virtual Assistant',
    trigger: '/care',
    description: 'Healthcare workflow for patient care coordination',
    definition: chroniousWorkflow
  }
};

/**
 * Get form definition by ID
 * @param {string} formId - Form identifier
 * @returns {Object|null} Form definition or null
 */
function getFormDefinition(formId) {
  return forms[formId] || null;
}

/**
 * Get all available forms
 * @returns {Object} All form definitions
 */
function getAllForms() {
  return forms;
}

/**
 * Get form by trigger command
 * @param {string} trigger - Trigger command (e.g., "/care")
 * @returns {Object|null} Form definition or null if not found
 */
function getFormByTrigger(trigger) {
  const formEntry = Object.values(forms).find(form => form.trigger === trigger);
  return formEntry || null;
}

/**
 * Get list of available triggers
 * @returns {Array} Array of trigger commands
 */
function getAvailableTriggers() {
  return Object.values(forms).map(form => form.trigger);
}

module.exports = {
  forms,
  getFormDefinition,
  getAllForms,
  getFormByTrigger,
  getAvailableTriggers
};