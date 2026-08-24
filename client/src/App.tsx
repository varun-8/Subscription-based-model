import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Customer from './Customer';
import Admin from './Admin';
import { LicenseProvider } from './context/LicenseContext';
// LICENSE SYSTEM DISABLED: ActivationScreen and LicenseCheck removed
// import ActivationScreen from './ActivationScreen';

// LICENSE SYSTEM DISABLED: LicenseCheck component commented out
// const LicenseCheck = ({ children }: { children: any }) => { ... };

function App() {
  return (
    <LicenseProvider>
      {/* LICENSE SYSTEM DISABLED: LicenseCheck wrapper removed */}
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </LicenseProvider>
  );
}

export default App;
