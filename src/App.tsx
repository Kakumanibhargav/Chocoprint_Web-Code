import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Splash from './screens/Splash';
import SignIn from './screens/SignIn';
import SignUp from './screens/SignUp';
import ForgotPassword from './screens/ForgotPassword';
import VerificationCode from './screens/VerificationCode';
import ResetPassword from './screens/ResetPassword';
import Home from './screens/Home';
import SelectDesign from './screens/SelectDesign';
import Parameters from './screens/Parameters';
import Simulation from './screens/Simulation';
import GCodePreview from './screens/GCodePreview';
import MultiColorConfig from './screens/MultiColorConfig';
import MultiColorSimulation from './screens/MultiColorSimulation';
import Operating from './screens/Operating';
import LiveData from './screens/LiveData';

function App() {
  return (
    <Router>
      <div className="min-h-screen app-container">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify" element={<VerificationCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/select" element={<SelectDesign />} />
          <Route path="/parameters" element={<Parameters />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/gcode-preview" element={<GCodePreview />} />
          <Route path="/multi-color" element={<MultiColorConfig />} />
          <Route path="/multi-simulation" element={<MultiColorSimulation />} />
          <Route path="/operating" element={<Operating />} />
          <Route path="/live-data" element={<LiveData />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
