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
import todosRouter from "./routes/todos.js";
import wantsRouter from "./routes/wants.js";
import hangoutsRouter from "./routes/hangouts.js";
import uploadsRouter from "./routes/uploads.js";
import expensesRouter from "./routes/expenses.js";
import friendsRouter from "./routes/friends.js";
import activitiesRouter from "./routes/activities.js";

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
app.use("/api/todos", todosRouter);
app.use("/api/wants", wantsRouter);
app.use("/api/hangouts", hangoutsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/activities", activitiesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`🐷 BaadFunds backend running on http://localhost:${PORT}`);
});
