const joi = require('joi');

const createWorkflowKeys = joi.object({
    name: joi.string().required(),
    description: joi.string().allow('', null).optional(),
    selected: joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Brain ID
    trigger: joi.object().optional(),
    n8nWorkflowId: joi.string().optional(),
    isPrivate: joi.boolean().optional(),
});

const editWorkflowKeys = joi.object({
    name: joi.string().optional(),
    description: joi.string().allow('', null).optional(),
    trigger: joi.object().optional(),
    n8nWorkflowId: joi.string().optional(),
    isPrivate: joi.boolean().optional(),
    isActive: joi.boolean().optional(),
});

const saveToN8nKeys = joi.object({
    workflowJson: joi.alternatives().try(
        joi.string().required(),
        joi.object().required()
    ).required(),
    brainId: joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    isUpdate: joi.boolean().optional().default(false),
});

module.exports = {
    createWorkflowKeys,
    editWorkflowKeys,
    saveToN8nKeys
};
