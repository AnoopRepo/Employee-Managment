import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Component/Login";
import Signup from "./Component/Signup";
import Navbar from "./Component/Navbar";
import Home from "./Component/Home";
import Dashboard from "./Component/Dashboard";
import ProtectedRoute from "./Component/ProtectedRoute";
import AdminUsers from "./Component/AdminUsers";
import { AuthProvider } from "./context/AuthContext";


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white font-sans selection:bg-blue-500/30">
          <Navbar/>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly={true}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<div className="p-10 text-center text-xl">About Page</div>} />
            <Route path="/contact" element={<div className="p-10 text-center text-xl">Contact Page</div>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;