import React from "react";

const AccountDeletion = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Account Deletion – MyNaai</h1>

      <p>
        Users can request deletion of their <strong>MyNaai</strong> account at
        any time.
      </p>

      <h2>How to Request Account Deletion</h2>
      <p>
        To request deletion of your account, please send an email from your
        registered mobile number or email address to:
      </p>

      <p style={styles.email}>
        📧 <strong>support@mynaai.com</strong>
      </p>

      <p>
        <strong>Email Subject:</strong> Account Deletion Request
      </p>

      <h2>Information to Include</h2>
      <ul>
        <li>Registered mobile number</li>
        <li>Registered email address (if applicable)</li>
      </ul>

      <h2>What Happens After Request</h2>
      <ul>
        <li>Your MyNaai account will be permanently deleted</li>
        <li>Your personal information will be removed</li>
        <li>Your booking history will be deleted</li>
      </ul>

      <p>
        Account deletion will be completed within{" "}
        <strong>7 working days</strong> from the date of request.
      </p>

      <h2>Data Retention</h2>
      <p>
        Certain information may be retained if required by law or for security
        and fraud prevention purposes.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions regarding account deletion, please contact us
        at:
      </p>

      <p style={styles.email}>
        📧 <strong>support@mynaai.com</strong>
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
    marginBottom: "30px",
  },
  email: {
    backgroundColor: "#f5f5f5",
    padding: "10px",
    display: "inline-block",
    borderRadius: "6px",
  },
};

export default AccountDeletion;
