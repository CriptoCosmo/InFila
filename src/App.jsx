import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import Join from './screens/Join.jsx';
import Ticket from './screens/Ticket.jsx';
import Staff from './screens/Staff.jsx';
import Display from './screens/Display.jsx';
import Admin from './screens/Admin.jsx';
import Login from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';
import NewVenue from './screens/NewVenue.jsx';
import { OwnerRoute } from './components/OwnerRoute.jsx';
import { useOwnerAuth } from './lib/hooks.js';
import { Loader } from './components.jsx';

const conSlug = (C) => function Wrapped() {
  const { slug, ticketId } = useParams();
  return <C slug={slug} ticketId={ticketId} />;
};

const JoinR = conSlug(Join), TicketR = conSlug(Ticket);
const StaffR = conSlug(Staff), DisplayR = conSlug(Display), AdminR = conSlug(Admin);

function RootRedirect() {
  const { owner, loading } = useOwnerAuth();
  if (loading) return <Loader scuro />;
  return <Navigate to={owner ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<OwnerRoute><Dashboard /></OwnerRoute>} />
      <Route path="/new-venue" element={<OwnerRoute><NewVenue /></OwnerRoute>} />
      <Route path="/v/:slug" element={<JoinR />} />
      <Route path="/v/:slug/t/:ticketId" element={<TicketR />} />
      <Route path="/v/:slug/staff" element={<OwnerRoute><StaffR /></OwnerRoute>} />
      <Route path="/v/:slug/display" element={<DisplayR />} />
      <Route path="/v/:slug/admin" element={<OwnerRoute><AdminR /></OwnerRoute>} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
