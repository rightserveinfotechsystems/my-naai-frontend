import { useMemo, useState, useEffect, useCallback } from "react";

const TermsAndConditions = () => {
  return (
    // Layout ki jagah direct div use kiya hai
    <div className="page-content min-vh-100 d-flex flex-column gap-2 gap-md-3 p-2 p-md-3 bg-light">
      
      {/* MAIN CARD CONTAINER */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          <h2 className="mb-4 fw-bold text-dark">Terms and Conditions</h2>
          <hr className="mb-4" />
          
          <section className="mb-4">
            <h5 className="fw-bold text-primary">1. Introduction</h5>
            <p className="text-muted">
              Welcome to our platform. By accessing this website, we assume you accept these terms and conditions. 
              Please do not continue to use the website if you do not agree to all of the terms and conditions stated on this page.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-primary">2. User Responsibility</h5>
            <p className="text-muted">
              Users are responsible for maintaining the confidentiality of their account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-primary">3. Privacy Policy</h5>
            <p className="text-muted">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
              use, and protect your personal information.
            </p>
          </section>

          <section className="mb-4">
            <h5 className="fw-bold text-primary">4. Service Modifications</h5>
            <p className="text-muted">
              We reserve the right to modify or discontinue the service at any time without notice. 
              We shall not be liable to you or any third party for any modification, suspension, or discontinuance.
            </p>
          </section>

          <div className="mt-5 p-3 bg-white border rounded">
            <p className="small text-secondary mb-0">
              * Last updated: January 2026. If you have any questions, contact us at support@example.com
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;