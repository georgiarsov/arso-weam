const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { CUSTOM_PAGINATE_LABELS } = require('../config/constants/common');
const { brainSchema, userSchema } = require('../utils/commonSchema');

mongoosePaginate.paginate.options = { customLabels: CUSTOM_PAGINATE_LABELS };

const schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        // Owner of the workflow
        user: userSchema,
        // Brain this workflow belongs to (for access control)
        brain: brainSchema,

        isActive: {
            type: Boolean,
            default: true,
        },
        isShare: {
            type: Boolean,
            default: false,
        },

        // n8n specific fields
        n8nWorkflowId: {
            type: String,
            index: true,
        },

        // Trigger configuration
        trigger: {
            type: { type: String, enum: ['manual', 'schedule', 'webhook', 'chat'] }, // 'chat' = #trigger
            value: { type: String }, // e.g., the #keyword
        },

        // Local cache of workflow structure (for quick viewing/editing maybe)
        // We treat n8n as source of truth but keep a copy here
        nodes: { type: Schema.Types.Mixed },
        connections: { type: Schema.Types.Mixed },

        // Execution stats
        lastExecutedAt: {
            type: Date,
        },
        executionCount: {
            type: Number,
            default: 0,
        },

        deletedAt: { type: Date },
    },
    { timestamps: true }
);

schema.plugin(mongoosePaginate);

// Index for chat trigger lookup
// Ensure fast lookup by trigger keyword within a brain (or global if we allow across brains)
schema.index({ 'trigger.value': 1, 'brain.id': 1 });

const workflow = model('workflow', schema, 'workflow');

module.exports = workflow;
