import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import plansRouter from "./routes/plans.js";
import investmentsRouter from "./routes/investments.js";
import paymentsRouter from "./routes/payments.js";
import withdrawalsRouter from "./routes/withdrawals.js";
import loansRouter from "./routes/loans.js";
import couponsRouter from "./routes/coupons.js";
import adminRouter from "./routes/admin.js";
import chatbotRouter from "./routes/chatbot.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, project: "BaadFunds" }));

app.use("/api/plans", plansRouter);
app.use("/api/investments", investmentsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/loans", loansRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/chatbot", chatbotRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`🐷 BaadFunds backend running on http://localhost:${PORT}`);
});
