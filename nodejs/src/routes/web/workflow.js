const express = require('express');
const router = express.Router();
const workflowController = require('../../controller/web/workflowController');
const { createWorkflowKeys, editWorkflowKeys, saveToN8nKeys } = require('../../utils/validations/workflow');
const { authentication } = require('../../middleware/authentication');
const validate = require('../../middleware/validate');

router.post('/create', validate(createWorkflowKeys), authentication, workflowController.addWorkflow);
router.post('/list', authentication, workflowController.getWorkflowList);
router.post('/user/getAll', authentication, workflowController.usersWiseGetAll);
router.delete('/delete/:id', authentication, workflowController.deleteWorkflow);
router.put('/update/:id', validate(editWorkflowKeys), authentication, workflowController.updateWorkflow);
router.post('/sync', authentication, workflowController.syncWorkflows);
router.post('/execute', authentication, workflowController.executeWorkflow);
router.post('/save-to-n8n', validate(saveToN8nKeys), authentication, workflowController.saveToN8n);

module.exports = router;
