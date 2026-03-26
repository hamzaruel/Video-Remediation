import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accessibilityRouter from "./accessibility";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accessibilityRouter);

export default router;
