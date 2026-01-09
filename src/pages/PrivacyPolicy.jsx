import React from "react";

const PrivacyPolicy = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Privacy Policy</h1>
      <p style={styles.date}>Effective Date: 09 January 2026</p>

      <p>
        MyNaai (“we”, “our”, “us”) operates the MyNaai mobile application and
        website. This Privacy Policy explains how we collect, use, and protect
        your information when you use our services.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>a) Personal Information</h3>
      <ul>
        <li>Name</li>
        <li>Mobile number</li>
        <li>Email address (optional)</li>
        <li>Location (city/area only)</li>
        <li>Profile details (optional)</li>
      </ul>

      <h3>b) Booking Information</h3>
      <ul>
        <li>Selected salon</li>
        <li>Appointment date & time</li>
        <li>Service details</li>
      </ul>

      <h3>c) Device Information</h3>
      <ul>
        <li>Device type</li>
        <li>Operating system</li>
        <li>App version</li>
        <li>IP address (for security & analytics)</li>
      </ul>

      <h2>2. What We Do NOT Collect</h2>
      <p>
        We do <strong>not</strong> collect or store:
      </p>
      <ul>
        <li>Credit or debit card details</li>
        <li>UPI or wallet information</li>
        <li>Bank account details</li>
        <li>Online payment information</li>
      </ul>
      <p>
        <strong>
          All payments are made directly at the salon and not through the app.
        </strong>
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To show nearby salons</li>
        <li>To enable appointment booking</li>
        <li>To notify users about booking updates</li>
        <li>To improve app performance and user experience</li>
        <li>To prevent fraud and misuse</li>
      </ul>

      <h2>4. Location Information</h2>
      <p>
        MyNaai may use approximate location (city or area) to show nearby salons.
        We do not track real-time or background location.
      </p>

      <h2>5. Data Sharing</h2>
      <p>
        We do not sell or rent your personal data. Information may be shared only:
      </p>
      <ul>
        <li>With the selected salon for booking confirmation</li>
        <li>When required by law</li>
        <li>To protect users and platform security</li>
      </ul>

      <h2>6. Data Security</h2>
      <p>
        We use reasonable security measures such as secure servers and encrypted
        communication to protect user data. However, no method of transmission
        over the internet is 100% secure.
      </p>

      <h2>7. Children’s Privacy</h2>
      <p>
        MyNaai is not intended for children under the age of 13. We do not
        knowingly collect personal information from children.
      </p>

      <h2>8. User Rights</h2>
      <ul>
        <li>Update or correct your profile</li>
        <li>Request account deletion</li>
        <li>Contact us for data-related concerns</li>
      </ul>

      <h2>9. Third-Party Services</h2>
      <p>
        We may use third-party services for analytics, notifications, and app
        performance monitoring. These services have their own privacy policies.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        posted on this page with an updated effective date.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        <strong>MyNaai</strong>
        <br />
        Email: support@mynaai.com
        <br />
        Location: India
      </p>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
  },
  heading: {
    textAlign: "center",
    marginBottom: "10px",
  },
  date: {
    textAlign: "center",
    color: "#666",
    marginBottom: "30px",
  },
};

export default PrivacyPolicy;
