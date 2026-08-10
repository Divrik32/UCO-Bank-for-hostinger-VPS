import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import Loan from './pages/Loan'
import Login from './pages/Login'
import PI1 from './pages/PI1'
import MGI2 from './pages/MGI2'
import MBI3 from './pages/MBI3'
import NI4 from './pages/NI4'
import Edit from './pages/Edit'
import AdminUpdates from './pages/AdminUpdates'
import MemberApproval from './pages/MembarApproval'
import ShareApproval from './pages/ShareApproval'
import GlobalUpdates from './pages/GlobalUpdates'
import LoanApproval from './pages/LoanApproval'
import Register from './pages/Register'
import UserReport from './pages/UserReport'
import AdminReport from './pages/AdminReport'
import AdminLayout from './components/AdminLayout'
import UserLayout from './components/UserLayout'
import ProtectedRoute from "./components/ProtectedRoute";
import MemberApprovalDetail from './pages/MemberApprovalDetail'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@fontsource/manrope";
import "@fontsource/poppins";
import "@fontsource/inter";
import { Toaster } from "react-hot-toast";
import ThriftFundInterestRate from './pages/ThriftFundInterestRate'
import ShareInterestRate from './pages/Shareinterestrate'
import LoanInterestRate from './pages/Loaninterestrate'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ThriftFundReport from './pages/ThriftFundReport'
import LoanReport from './pages/LoanReport'
import LoanReportDetails from './pages/LoanReportDetails'
import ThriftFund from './pages/ThriftFund'
import ThriftFundDetails from './pages/ThriftFundDetails'
import SharePurchase from './pages/SharePurchase'
import ShareReport from './pages/ShareReport'
import ShareDetails from './pages/ShareDetails'

function App() {
  return (<>
    <BrowserRouter>
      <Routes>
        {/* Login - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />
        {/* All other pages - inside Admin Layout */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <Dashboard
                loanBalance={3501852.0}
                thriftBalance={643192}
                activeMembers={8}
                inactiveMembers={0}
                shareBalance={200000.0}
              />
            }
          />
          <Route path="/admin/loan"   element={<Loan />} />
          <Route path="/admin/report" element={<AdminReport />} />
          <Route path="/admin/share"  element={<SharePurchase />} />
          <Route path="/admin/thrift" element={<ThriftFund />} />
          <Route path="/admin/pi1"    element={<PI1 />} />
          <Route path="/admin/mgi2"    element={<MGI2 />} />
          <Route path="/admin/mbi3"   element={<MBI3 />} />
          <Route path="/admin/ni4"    element={<NI4 />} />
          <Route path="/admin/edit"   element={<Edit />} />
          <Route path="/admin/admin-update"   element={<AdminUpdates />} />
          <Route path="/admin/member_approval_list"   element={<MemberApproval />} />
          <Route path="/admin/member_approval/:id"   element={<MemberApprovalDetail />} />
          <Route path="/admin/loan-report" element={<LoanReport />}/>
          <Route path="/admin/loan-report-details/:memberId" element={<LoanReportDetails />}/>
          <Route path="/admin/thrift-fund-report" element={<ThriftFundReport />}/>
          <Route path="/admin/thrift-fund-details/:memberId" element={<ThriftFundDetails />}/>
          <Route path="/admin/share-report" element={<ShareReport />}/>
          <Route path="/admin/share-details/:memberId" element={<ShareDetails />}/>
          <Route path="/admin/share_approval_list"   element={<ShareApproval />} />
          <Route path="/admin/loan_approval_list"   element={<LoanApproval />} />
          <Route path="/admin/Global_update"   element={<GlobalUpdates />} />
          <Route path="/admin/thrift-fund-interest" element={<ThriftFundInterestRate />} />
          <Route path="/admin/share-interest"       element={<ShareInterestRate />} />
          <Route path="/admin/loan-interest"        element={<LoanInterestRate />} />
        </Route>
        </Route>


        {/* All other pages - inside User Layout */}
        <Route element={<ProtectedRoute allowedRole="user" />}>
        <Route element={<UserLayout />}>
          <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
          <Route
            path="/user/dashboard"
            element={
              <Dashboard
                loanBalance={3501852.0}
                thriftBalance={643192}
                activeMembers={8}
                inactiveMembers={0}
                shareBalance={200000.0}
              />
            }
          />
          <Route path="/user/loan"   element={<Loan />} />
          <Route path="/user/report" element={<UserReport />} />
          <Route path="/user/share"  element={<SharePurchase />} />
          <Route path="/user/thrift" element={<ThriftFund />} />
          <Route path="/user/pi1"    element={<PI1 />} />
          <Route path="/user/mgi2"    element={<MGI2 />} />
          <Route path="/user/mbi3"   element={<MBI3 />} />
          <Route path="/user/ni4"    element={<NI4 />} />
          <Route path="/user/edit"   element={<Edit />} />
          {/* <Route path="user/admin-update"   element={<AdminUpdates />} /> */}
          <Route path="/user/member_approval_list"   element={<MemberApproval />} />
          <Route path="/user/member_approval/:id"   element={<MemberApprovalDetail />} />
          <Route path="/user/loan-report" element={<LoanReport />}/>
          <Route path="/user/loan-report-details/:memberId" element={<LoanReportDetails />}/>
          <Route path="/user/thrift-fund-report" element={<ThriftFundReport />}/>
          <Route path="/user/thrift-fund-details/:memberId" element={<ThriftFundDetails />}/>
          <Route path="/user/share-report" element={<ShareReport />}/>
          <Route path="/user/share-details/:memberId" element={<ShareDetails />}/>
          <Route path="/user/Global_update"   element={<GlobalUpdates />} />
          <Route path="/user/share_approval_list"   element={<ShareApproval />} />
          <Route path="/user/loan_approval_list"   element={<LoanApproval />} />
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    <ToastContainer position="top-right" autoClose={3000} />
    <Toaster position="top-right" reverseOrder={false} />
    </>
  )
}

export default App