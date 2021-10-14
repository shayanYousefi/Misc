import {Router} from 'express';

import {mainController} from "../controllers/main";

let router = Router();

router.get('/',mainController);

export default router;