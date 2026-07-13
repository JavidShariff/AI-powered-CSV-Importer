import { Router } from "express";
import health from "./health.routes";
import importRoutes from "./import.routes";

const router = Router();
router.use("/health", health);
router.use("/import", importRoutes);
export default router;
