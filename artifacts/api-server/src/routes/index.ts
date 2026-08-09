import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import categoriesRouter from "./categories";
import recurringRouter from "./recurring";
import budgetsRouter from "./budgets";
import budgetAlertsRouter from "./budget-alerts";
import reportsRouter from "./reports";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(categoriesRouter);
router.use(recurringRouter);
router.use(budgetsRouter);
router.use(budgetAlertsRouter);
router.use(reportsRouter);
router.use(settingsRouter);

export default router;
