import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pricesRouter from "./prices";
import mspRouter from "./msp";
import marketsRouter from "./markets";
import fairnessRouter from "./fairness";
import chatRouter from "./chat";
import alertsRouter from "./alerts";
import schemesRouter from "./schemes";
import weatherRouter from "./weather";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pricesRouter);
router.use(mspRouter);
router.use(marketsRouter);
router.use(fairnessRouter);
router.use(chatRouter);
router.use(alertsRouter);
router.use(schemesRouter);
router.use(weatherRouter);
router.use(dashboardRouter);

export default router;
