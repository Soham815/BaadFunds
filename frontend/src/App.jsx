import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Chatbot from "./components/Chatbot.jsx";
import CouponPopup from "./components/CouponPopup.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Plans from "./pages/Plans.jsx";
import Enroll from "./pages/Enroll.jsx";
import Payment from "./pages/Payment.jsx";
import Calculator from "./pages/Calculator.jsx";
import Loan from "./pages/Loan.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

function BaadLayout({ children }) {
	return (
		<div className="app-shell">
			<Navbar />
			<main className="page">{children}</main>
			<Chatbot />
			<CouponPopup />
		</div>
	);
}

export default function App() {
	return (
		<Routes>
			{/* Baad's world */}
			<Route path="/" element={<BaadLayout><Dashboard /></BaadLayout>} />
			<Route path="/plans" element={<BaadLayout><Plans /></BaadLayout>} />
			<Route path="/enroll/:planId" element={<BaadLayout><Enroll /></BaadLayout>} />
			<Route path="/pay/:paymentId" element={<BaadLayout><Payment /></BaadLayout>} />
			<Route path="/calculator" element={<BaadLayout><Calculator /></BaadLayout>} />
			<Route path="/loan" element={<BaadLayout><Loan /></BaadLayout>} />

			{/* Soham's control room */}
			<Route path="/admin" element={<AdminGate />} />
		</Routes>
	);
}

function AdminGate() {
	const isAuthed = !!localStorage.getItem("baadfunds_admin_token");
	return isAuthed ? <AdminDashboard /> : <AdminLogin />;
}
