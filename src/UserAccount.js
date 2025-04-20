import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import { updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage, getPaymentDetails } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  Form,
  Alert,
  Card,
  ProgressBar,
  Badge,
  Container,
  Row,
  Col,
  Tabs,
  Tab,
  Tooltip,
  OverlayTrigger,
  Modal,
  InputGroup,
  ListGroup,
  Image,
  Table,
} from 'react-bootstrap';
import {
  FaUser,
  FaLock,
  FaPhone,
  FaCrown,
  FaSearch,
  FaInfoCircle,
  FaSave,
  FaCamera,
  FaTrash,
  FaCheckCircle,
  FaHistory,
  FaBell,
  FaShieldAlt,
  FaCalendarAlt,
  FaPencilAlt,
  FaSignOutAlt,
  FaCog,
  FaChartLine,
  FaKey,
  FaIdCard,
  FaLockOpen,
  FaFingerprint,
  FaExclamationTriangle,
  FaEnvelope,
  FaCheck,
  FaCreditCard,
  FaReceipt,
  FaFileInvoiceDollar,
  FaDollarSign,
} from 'react-icons/fa';
import Subscribe from './Subscribe';

// Inline CSS from your provided styles, with footer styles removed
const GlobalStyles = () => (
  <style>
    {`
      html, body, #root {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      #root {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      /* === UserAccount Component Specific Styling === */
      /* UserAccount Layout */
      .user-account-container {
        padding: 2rem 0;
        flex: 1 0 auto; /* Ensure it expands to push global footer down */
      }

      /* UserAccount Cards */
      .user-account-card {
        background-color: var(--profile-card-bg);
        border: none;
        border-radius: 12px;
        box-shadow: var(--profile-card-shadow);
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .user-account-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(var(--accent-color-rgb), 0.1);
      }

      /* Make sure all text in the user account container is visible in all themes */
      .user-account-container {
        color: var(--text-color);
      }
      
      .user-account-container p,
      .user-account-container span,
      .user-account-container div,
      .user-account-container h1,
      .user-account-container h2,
      .user-account-container h3,
      .user-account-container h4,
      .user-account-container h5,
      .user-account-container h6,
      .user-account-container small {
        color: var(--text-color);
      }

      /* Fix specifically for emails, dates, and other important info */
      .user-email,
      .email-display,
      .user-account-container .email,
      .user-info .email,
      .profile-email,
      .account-info .email {
        color: var(--accent-color) !important;
        font-weight: 500;
      }
      
      /* If the email appears in a list-group-item */
      .list-group-item .email-value,
      .list-group-item strong,
      .user-account-container .list-group-item .text-value {
        color: var(--accent-color) !important;
        font-weight: 500;
      }

      /* Fix specifically for dates like "Member since" */
      .member-since-date,
      .user-account-container .text-muted,
      .user-account-card .text-muted {
        color: var(--muted-paragraph-color) !important;
        opacity: 0.8;
      }

      /* Form Controls in UserAccount */
      .user-account-container .form-control,
      .user-account-container .form-select,
      .user-account-container .input-group-text {
        background-color: var(--form-control-bg);
        border-color: var(--form-control-border);
        color: var(--text-color);
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        transition: all 0.2s ease;
      }

      .user-account-container .form-control:focus,
      .user-account-container .form-select:focus {
        border-color: var(--form-control-focus-border);
        box-shadow: var(--form-control-focus-shadow);
        outline: none;
      }

      .user-account-container .form-label {
        color: var(--form-label-color);
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      /* Avatar Container */
      .avatar-container {
        position: relative;
        width: 130px;
        height: 130px;
        margin: 0 auto;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid var(--card-bg);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        background-color: var(--avatar-bg);
        transition: all 0.3s ease;
      }

      .avatar-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .camera-button {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background-color: var(--card-bg);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--border-color);
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        opacity: 0.7;
        transform: translateY(5px);
      }

      .avatar-container:hover .camera-button {
        opacity: 1;
        transform: translateY(0);
      }

      .camera-button:hover {
        background-color: var(--accent-color);
        border-color: var(--accent-color);
        color: white;
      }

      /* User Information List */
      .user-account-container .list-group-item {
        background-color: transparent;
        border-color: var(--border-color);
        color: var(--text-color);
        padding: 0.75rem 0;
      }

      /* Ensure user info fields like email and username are visible */
      .user-info-field,
      .profile-info-value,
      .account-detail-value {
        color: var(--accent-color) !important;
        font-weight: 500;
      }

      /* Tab Navigation */
      .user-account-container .nav-tabs {
        border-bottom: 1px solid var(--border-color);
      }

      .user-account-container .nav-tabs .nav-link {
        color: var(--text-color);
        border: none;
        border-bottom: 2px solid transparent;
        border-radius: 0;
        padding: 0.75rem 1.25rem;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .user-account-container .nav-tabs .nav-link:hover {
        border-color: var(--accent-color);
        color: var(--accent-color);
      }

      .user-account-container .nav-tabs .nav-link.active {
        border-color: var(--accent-color);
        color: var(--accent-color);
        background-color: transparent;
        font-weight: 600;
      }

      /* Tab Content */
      .user-account-container .tab-content {
        color: var(--text-color) !important;
      }

      /* High-contrast adjustments for notification tab */
      #notifications {
        color: #FFFF00 !important; /* Bright yellow for high contrast */
      }

      #notifications h5 {
        color: #FFFF00 !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;
      }

      #notifications p {
        color: #FFFF00 !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;
      }

      /* More specific target for any text center elements in notifications tab */
      #notifications .text-center {
        text-align: center;
        margin: 20px auto;
        background-color: rgba(0,0,0,0.3) !important;
        padding: 20px !important;
        border-radius: 10px !important;
      }

      #notifications .text-center h5 {
        color: #FFFF00 !important;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;
      }

      #notifications .text-center p {
        color: #FFFF00 !important;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;
      }

      /* Custom Badges */
      .membership-badge {
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 20px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      }

      /* Timeline Styling for Activity History */
      .timeline-item {
        border-left: 3px solid var(--timeline-border);
        padding-left: 20px;
        position: relative;
        padding-bottom: 20px;
      }

      .timeline-circle {
        position: absolute;
        left: -8px;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background-color: var(--timeline-circle);
      }

      /* Card styling */
      .dashboard-card {
        border: none;
        border-radius: 12px;
        box-shadow: var(--profile-card-shadow);
        transition:
          transform 0.2s ease-in-out,
          box-shadow 0.2s ease-in-out;
      }

      .dashboard-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 25px rgba(var(--accent-color-rgb), 0.15);
      }

      /* Settings Icon Styling */
      .settings-icon-container {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--settings-icon-bg);
        margin-right: 15px;
      }

      .settings-icon-container .settings-icon {
        font-size: 1.2rem;
        color: var(--accent-color);
      }

      /* Password Strength Meter */
      .password-strength-meter {
        height: 6px;
        border-radius: 3px;
        margin-top: 0.5rem;
      }

      /* Custom Input Styling for UserAccount */
      .custom-input {
        position: relative;
      }

      .custom-input .icon-prefix {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-color);
        opacity: 0.6;
      }

      .custom-input .form-control {
        padding-left: 40px;
      }

      /* Notification Item Styling */
      .notification-item {
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 10px;
        transition: all 0.2s ease;
        color: var(--text-color) !important;
      }

      .notification-item:hover {
        background-color: var(--notification-item-hover);
      }

      /* Fix for notification text and content */
      .notification-item .notification-content,
      .notification-item .notification-title,
      .notification-item .notification-time,
      .notification-item p,
      .notification-item small,
      .notification-item span,
      .notification-item div,
      .notification-item strong {
        color: var(--text-color) !important;
      }

      .notification-item .notification-time {
        color: var(--muted-paragraph-color) !important;
        opacity: 0.8;
      }

      /* Make sure notification-title stands out */
      .notification-item .notification-title,
      .notification-item h6, 
      .notification-item .fw-bold {
        color: var(--accent-color) !important;
        font-weight: 600 !important;
      }

      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Recent notification styling */
      .notification-item.recent,
      .notification-item.unread {
        background-color: rgba(var(--accent-color-rgb), 0.08);
        border-left: 3px solid var(--accent-color);
      }

      /* Empty state - Super aggressive styling */
      .no-notifications-container,
      .empty-notifications {
        color: #FFFF00 !important;
        background-color: rgba(0,0,0,0.3) !important;
        padding: 20px !important;
        border-radius: 10px !important;
        margin: 20px auto;
        text-align: center;
      }
      
      /* Special catch-all rule for any empty states */
      .no-notifications-container h5,
      .no-notifications-container p,
      .empty-notifications h5,
      .empty-notifications p,
      .user-account-container .tab-content > #notifications h5,
      .user-account-container .tab-content > #notifications p,
      .tab-content > #notifications h5,
      .tab-content > #notifications p,
      .tab-content .tab-pane#notifications h5,
      .tab-content .tab-pane#notifications p,
      .user-account-container .tab-content .tab-pane#notifications h5, 
      .user-account-container .tab-content .tab-pane#notifications p {
        color: #FFFF00 !important;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;
      }
      
      /* Emergency styling - use inline styles directly in the tab */
      .tab-content > #notifications {
        position: relative;
      }

      .tab-content > #notifications::after {
        content: "No New Notifications\\AYou're all caught up!";
        white-space: pre;
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #FFFF00 !important;
        font-weight: bold;
        font-size: 18px;
        text-align: center;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        background: rgba(0,0,0,0.3);
        padding: 20px;
        border-radius: 10px;
        z-index: 100;
      }

      /* Dark mode specific styles */
      [data-theme='dark'] #notifications h5,
      [data-theme='dark'] #notifications p,
      [data-theme='dark'] #notifications .text-center h5,
      [data-theme='dark'] #notifications .text-center p {
        color: #FFFF00 !important;
        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;
      }

      /* Modals in UserAccount */
      .user-account-modal .modal-content {
        border-radius: 15px;
        border: none;
        overflow: hidden;
        background-color: var(--card-bg);
        color: var(--text-color);
      }

      .user-account-modal .modal-header {
        border-bottom: 1px solid var(--border-color);
        padding: 1.25rem 1.5rem;
      }

      .user-account-modal .modal-footer {
        border-top: 1px solid var(--border-color);
        padding: 1.25rem 1.5rem;
      }

      .user-account-modal .modal-body {
        padding: 1.5rem;
      }

      /* Alert styling refinements */
      .alert {
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
      }

      .alert .btn-close {
        margin-left: auto;
        font-size: 1.2rem;
        padding: 0.5rem;
        opacity: 0.7;
      }

      .alert .btn-close:hover {
        opacity: 1;
      }

      .alert-success {
        background-color: rgba(40, 167, 69, 0.15);
        border-color: rgba(40, 167, 69, 0.3);
        color: var(--text-color);
      }

      .alert-danger {
        background-color: rgba(220, 53, 69, 0.15);
        border-color: rgba(220, 53, 69, 0.3);
        color: var(--text-color);
      }

      .alert-warning {
        background-color: rgba(255, 193, 7, 0.15);
        border-color: rgba(255, 193, 7, 0.3);
        color: var(--text-color);
      }

      .alert-info {
        background-color: rgba(23, 162, 184, 0.15);
        border-color: rgba(23, 162, 184, 0.3);
        color: var(--text-color);
      }

      /* Buttons with icons */
      .btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .btn-icon i,
      .btn-icon svg {
        margin-right: 0.5rem;
      }

      /* Form animations */
      .form-control:focus + .form-label,
      .form-control:not(:placeholder-shown) + .form-label {
        transform: translateY(-20px) scale(0.85);
        color: var(--accent-color);
      }

      /* Fix Firebase CORS related styling */
      .image-preview-container {
        position: relative;
        width: 100%;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .image-preview-container img {
        width: 100%;
        max-height: 300px;
        object-fit: contain;
      }

      .image-upload-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 5px;
        background-color: var(--accent-color);
        transform-origin: left;
      }

      /* Override select element styling */
      .form-select {
        background-color: var(--form-control-bg);
        color: var(--text-color);
        border-color: var(--form-control-border);
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3E%3C/svg%3E");
      }

      [data-theme='dark'] .form-select {
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23adb5bd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3E%3C/svg%3E");
      }

      /* Label text and input values should always be visible */
      .user-account-container label,
      .user-account-container input,
      .user-account-container textarea,
      .user-account-container select,
      .user-account-container .form-control,
      .user-account-container .form-select {
        color: var(--text-color) !important;
      }
      
      /* Fix any text with the "text-muted" class in the user account area */
      .user-account-container .text-muted {
        color: var(--muted-paragraph-color) !important;
        opacity: 0.9;
      }

      /* Payment history table styling */
      .payment-history-table th,
      .payment-history-table td {
        color: var(--text-color);
        padding: 0.75rem 1rem;
        vertical-align: middle;
      }

      .payment-history-table thead th {
        background-color: rgba(var(--accent-color-rgb), 0.1);
        border-color: var(--border-color);
        font-weight: 500;
      }

      .payment-history-table tbody tr {
        transition: background-color 0.2s ease;
      }

      .payment-history-table tbody tr:hover {
        background-color: rgba(var(--accent-color-rgb), 0.05);
      }

      .transaction-badge {
        padding: 5px 10px;
        border-radius: 30px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      /* Smooth on-page animations for UserAccount */
      .fade-in {
        animation: fadeIn 0.5s ease-in;
      }

      .slide-in {
        animation: slideIn 0.5s ease-in;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Improved mobile responsiveness for UserAccount */
      @media (max-width: 768px) {
        .user-account-container .avatar-container {
          width: 100px;
          height: 100px;
        }

        .user-account-container .tab-content {
          padding: 1rem;
        }

        .user-account-container .nav-tabs .nav-link {
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
        }

        .membership-badge {
          padding: 6px 12px;
          font-size: 0.8rem;
        }
      }

      /* Advanced theme support for dark mode in forms */
      [data-theme='dark'] .form-control::-webkit-input-placeholder,
      [data-theme='dark'] .form-select::-webkit-input-placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      [data-theme='dark'] .form-control,
      [data-theme='dark'] .form-select {
        color: var(--text-color);
      }

      [data-theme='dark'] .input-group-text {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: var(--border-color);
        color: var(--text-color);
      }

      /* Fix for "member since" date and other small text */
      [data-theme='dark'] .text-muted,
      [data-theme='dark'] small, 
      [data-theme='dark'] .small {
        color: var(--muted-paragraph-color) !important;
      }

      /* Fix for modal close button in dark mode */
      [data-theme='dark'] .modal-header .btn-close {
        filter: var(--modal-close-filter);
      }

      /* Email specific styling for dark mode */
      [data-theme='dark'] .user-email,
      [data-theme='dark'] .email-display,
      [data-theme='dark'] .user-account-container .email,
      [data-theme='dark'] .user-info .email,
      [data-theme='dark'] .profile-email,
      [data-theme='dark'] .list-group-item strong,
      [data-theme='dark'] .account-detail-value,
      [data-theme='dark'] .user-info-field {
        color: var(--accent-color) !important;
      }

      /* Notifications badge count */
      .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background-color: var(--accent-color);
        color: white;
        font-size: 0.6rem;
        height: 18px;
        width: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: bold;
      }

      /* Accessibility improvements */
      .btn:focus,
      .form-control:focus,
      .form-select:focus {
        box-shadow: var(--form-control-focus-shadow);
        outline: none;
      }

      .nav-link:focus {
        outline: 2px solid rgba(var(--accent-color-rgb), 0.5);
        outline-offset: 2px;
      }

      /* Focus visible only when using keyboard navigation */
      .btn:focus:not(:focus-visible),
      .form-control:focus:not(:focus-visible),
      .form-select:focus:not(:focus-visible),
      .nav-link:focus:not(:focus-visible) {
        outline: none;
        box-shadow: none;
      }

      /* RTL support for UserAccount */
      [dir='rtl'] .avatar-container .camera-button {
        right: auto;
        left: 5px;
      }

      [dir='rtl'] .btn-icon i,
      [dir='rtl'] .btn-icon svg {
        margin-right: 0;
        margin-left: 0.5rem;
      }

      [dir='rtl'] .timeline-item {
        border-left: none;
        border-right: 3px solid var(--timeline-border);
        padding-left: 0;
        padding-right: 20px;
      }

      [dir='rtl'] .timeline-circle {
        left: auto;
        right: -8px;
      }

      /* Print styles for UserAccount */
      @media print {
        .user-account-container {
          background-color: white !important;
          color: black !important;
        }

        .user-account-container .card {
          box-shadow: none !important;
          border: 1px solid #ddd !important;
        }

        .user-account-container .btn {
          display: none !important;
        }

        .user-account-container .tab-content > .tab-pane {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .user-account-container .list-group-item {
          break-inside: avoid;
        }
      }

      /* Light Theme variables */
      :root {
        --profile-card-bg: #ffffff;
        --profile-card-shadow: 0 4px 15px rgba(2, 119, 189, 0.1);
        --form-control-bg: #ffffff;
        --form-control-border: #e2e8f0;
        --form-control-focus-border: #0288d1;
        --form-control-focus-shadow: 0 0 0 0.25rem rgba(2, 136, 209, 0.25);
        --avatar-bg: #f8f9fa;
        --settings-icon-bg: #e3f2fd;
        --notification-item-hover: #f0f8ff;
        --timeline-border: #0288d1;
        --timeline-circle: #0288d1;
        --form-label-color: #495057;
      }

      /* Dark Theme variables */
      [data-theme='dark'] {
        --profile-card-bg: #1a1a26;
        --profile-card-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        --form-control-bg: #242438;
        --form-control-border: #3a3a4a;
        --form-control-focus-border: #0288d1;
        --form-control-focus-shadow: 0 0 0 0.25rem rgba(2, 136, 209, 0.25);
        --avatar-bg: #242438;
        --settings-icon-bg: #3a3a4a;
        --notification-item-hover: #242438;
        --timeline-border: #0288d1;
        --timeline-circle: #0288d1;
        --form-label-color: #e0e5ff;
      }
    `}
  </style>
);
const UserAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // User data states
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [membership, setMembership] = useState('Free');
  const [searchLimit, setSearchLimit] = useState(0);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [lastLogin, setLastLogin] = useState(null);

  // Payment data states
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [lastPayment, setLastPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityHistory, setActivityHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [selectedTimeout, setSelectedTimeout] = useState('60');

  const user = auth.currentUser;

  // Check for payment success from URL after Stripe redirect
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentSuccess = queryParams.get('payment_success');
    const plan = queryParams.get('plan');

    if (paymentSuccess === 'true' && plan) {
      setSuccess(
        `Payment successful! Your account has been credited with additional searches.`
      );

      // Clear the URL parameters
      navigate('/user-account', { replace: true });

      // Refresh user data to show updated search limits
      fetchUserData();
    }
  }, [location, navigate]);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Get basic user data from Firestore
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setEmail(user.email || '');
        setDisplayName(user.displayName || '');
        setPhone(userData.phone || '');
        setMembership(userData.membership || 'Free');
        setSearchLimit(userData.searchLimit || 0);
        setSearchesUsed(userData.searchesUsed || 0);
        setProfilePhoto(user.photoURL || null);
        setCreatedAt(
          user.metadata.creationTime
            ? new Date(user.metadata.creationTime)
            : null
        );
        setLastLogin(
          user.metadata.lastSignInTime
            ? new Date(user.metadata.lastSignInTime)
            : null
        );

        if (userData.activityHistory) {
          setActivityHistory(userData.activityHistory.slice(0, 10));
        }

        if (userData.notifications) {
          setNotifications(userData.notifications.slice(0, 5));
        }
      }

      // Fetch payment history using Cloud Function
      try {
        const paymentData = await httpsCallable(getPaymentDetails)();
        if (paymentData.data) {
          setPaymentHistory(paymentData.data.paymentHistory || []);
          setLastPayment(paymentData.data.lastPayment || null);
          setSearchLimit(paymentData.data.searchLimit || 0);
          setSearchesUsed(paymentData.data.searchesUsed || 0);
        }
      } catch (err) {
        console.error('Error fetching payment data:', err);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Error loading user data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength += 25;

    setPasswordStrength(strength);
  }, [password]);

  const validateForm = useCallback(() => {
    setError('');
    if (displayName.trim() === '') {
      setError('Display name cannot be empty');
      return false;
    }
    if (password) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    if (phone && !/^\+?[\d\s-()]{10,15}$/.test(phone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    return true;
  }, [displayName, password, confirmPassword, phone]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      try {
        setLoading(true);
        const updates = {};

        if (displayName !== user.displayName) {
          await updateProfile(user, { displayName });
          updates.displayName = displayName;
        }

        if (email !== user.email) {
          await updateEmail(user, email);
          updates.email = email;
        }

        if (password) {
          await updatePassword(user, password);
        }

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          ...updates,
          phone,
          membership: membership.toLowerCase(),
          lastUpdated: serverTimestamp(),
          activityHistory: [
            {
              action: 'profile_update',
              timestamp: new Date().toISOString(),
              details: 'Updated profile information',
            },
            ...(activityHistory || []),
          ],
        });

        setSuccess('Profile updated successfully!');
        setPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Profile update error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [displayName, email, password, phone, membership, user, activityHistory]
  );

  const handlePhotoChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
      setShowPhotoModal(true);
    }
  }, []);

  const uploadProfilePhoto = useCallback(async () => {
    if (!photoFile) return;

    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const uniqueFilename = `profile-photos/${user.uid}_${timestamp}`;
      const fileRef = ref(storage, uniqueFilename);
      const metadata = {
        contentType: photoFile.type,
        customMetadata: {
          userId: user.uid,
          uploadTime: timestamp.toString(),
        },
      };
      await uploadBytes(fileRef, photoFile, metadata);
      const photoURL = await getDownloadURL(fileRef);
      await updateProfile(user, { photoURL });
      setProfilePhoto(photoURL);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePhoto: photoURL,
        activityHistory: [
          {
            action: 'photo_update',
            timestamp: new Date().toISOString(),
            details: 'Updated profile photo',
          },
          ...(activityHistory || []),
        ],
      });

      setShowPhotoModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess('Profile photo updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Failed to upload profile photo: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [photoFile, user, activityHistory]);

  const getMembershipColor = useCallback(() => {
    switch (membership.toLowerCase()) {
      case 'premium':
        return 'warning';
      case 'business':
        return 'info';
      case 'enterprise':
        return 'danger';
      default:
        return 'secondary';
    }
  }, [membership]);

  const getSearchUsagePercentage = useCallback(() => {
    if (!searchLimit) return 0;
    return (searchesUsed / searchLimit) * 100;
  }, [searchesUsed, searchLimit]);

  const getPasswordStrengthColor = useCallback(() => {
    if (passwordStrength < 50) return 'danger';
    if (passwordStrength < 75) return 'warning';
    return 'success';
  }, [passwordStrength]);

  const renderTooltip = useCallback(
    (props, content) => (
      <Tooltip id="button-tooltip" {...props}>
        {content}
      </Tooltip>
    ),
    []
  );

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Function to handle the purchase of more searches - redirects to pricing page
  const handlePurchaseMore = useCallback(() => {
    navigate('/pricing');
  }, [navigate]);

  // Function to view payment details
  const handleViewPayment = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  }, []);

  if (loading && !email) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '60vh' }}
      >
        <div className="text-center">
          <div className="spinner-grow text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-primary fw-bold">Loading your profile...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="d-flex flex-column min-vh-100">
        <main className="user-account-container">
          <Container>
            <Row className="mb-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="display-6 fw-bold">My Account</h1>
                    <p className="text-muted">
                      Today is{' '}
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge
                    bg={getMembershipColor()}
                    className="membership-badge d-none d-md-block"
                  >
                    <FaCrown className="me-2" />
                    {membership.charAt(0).toUpperCase() +
                      membership.slice(1)}{' '}
                    Member
                  </Badge>
                </div>
              </Col>
            </Row>

            {error && (
              <Alert
                variant="danger"
                className="alert mb-4 d-flex align-items-center"
              >
                <FaExclamationTriangle className="me-2 flex-shrink-0" />
                <div>{error}</div>
                <Button
                  variant="link"
                  className="ms-auto p-0 text-danger"
                  onClick={() => setError('')}
                  aria-label="Close alert"
                >
                  <span aria-hidden="true">×</span>
                </Button>
              </Alert>
            )}

            {success && (
              <Alert
                variant="success"
                className="alert mb-4 d-flex align-items-center"
              >
                <FaCheckCircle className="me-2 flex-shrink-0" />
                <div>{success}</div>
                <Button
                  variant="link"
                  className="ms-auto p-0 text-success"
                  onClick={() => setSuccess('')}
                  aria-label="Close alert"
                >
                  <span aria-hidden="true">×</span>
                </Button>
              </Alert>
            )}

            <Row className="g-4">
              <Col lg={4} className="mb-4">
                <Card className="user-account-card dashboard-card">
                  <Card.Body className="text-center p-4">
                    <div className="avatar-container">
                      {profilePhoto ? (
                        <Image
                          src={profilePhoto}
                          alt={displayName || email}
                          roundedCircle
                          loading="lazy"
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                          <FaUser size={50} className="text-secondary" />
                        </div>
                      )}
                      <div
                        className="camera-button"
                        onClick={() =>
                          document.getElementById('photo-upload').click()
                        }
                        title="Change profile photo"
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) =>
                          e.key === 'Enter' &&
                          document.getElementById('photo-upload').click()
                        }
                      >
                        <FaCamera className="text-primary" />
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={handlePhotoChange}
                          aria-label="Upload profile photo"
                        />
                      </div>
                    </div>

                    <h4 className="mt-3 mb-1">
                      {displayName || 'Set Your Name'}
                    </h4>
                    <p className="text-muted mb-3">{email}</p>

                    <Badge
                      bg={getMembershipColor()}
                      className="membership-badge d-block d-md-none mb-3"
                    >
                      <FaCrown className="me-2" />
                      {membership.charAt(0).toUpperCase() +
                        membership.slice(1)}{' '}
                      Member
                    </Badge>

                    <div className="mt-3">
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 px-0 py-2">
                          <div className="d-flex align-items-center">
                            <div className="settings-icon-container">
                              <FaCalendarAlt className="settings-icon" />
                            </div>
                            <span>Member Since</span>
                          </div>
                          <span className="text-muted">
                            {formatDate(createdAt)}
                          </span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 px-0 py-2">
                          <div className="d-flex align-items-center">
                            <div className="settings-icon-container">
                              <FaHistory className="settings-icon" />
                            </div>
                            <span>Last Login</span>
                          </div>
                          <span className="text-muted">
                            {formatDate(lastLogin)}
                          </span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 px-0 py-2">
                          <div className="d-flex align-items-center">
                            <div className="settings-icon-container">
                              <FaChartLine className="settings-icon" />
                            </div>
                            <span>Search Usage</span>
                          </div>
                          <span>
                            {searchesUsed}/{searchLimit}
                          </span>
                        </ListGroup.Item>
                      </ListGroup>
                    </div>

                    <div className="mt-4 d-grid gap-2">
                      <Button
                        variant="outline-primary"
                        className="btn-icon text-start"
                        onClick={() => setShowActivityModal(true)}
                        aria-label="View activity history"
                      >
                        <FaHistory className="me-2" /> View Activity History
                      </Button>
                      <Button
                        variant="outline-danger"
                        className="btn-icon text-start"
                        onClick={() => setShowDeleteModal(true)}
                        aria-label="Delete account"
                      >
                        <FaTrash className="me-2" /> Delete Account
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="user-account-card dashboard-card mt-4">
                  <Card.Body className="p-4">
                    <h5 className="d-flex align-items-center mb-3">
                      <FaSearch className="settings-icon me-2" />
                      Available Searches
                    </h5>
                    <div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Searches Used</span>
                        <span>
                          {searchesUsed} of {searchLimit}
                        </span>
                      </div>
                      <ProgressBar
                        now={getSearchUsagePercentage()}
                        variant={
                          getSearchUsagePercentage() >= 90
                            ? 'danger'
                            : getSearchUsagePercentage() >= 70
                              ? 'warning'
                              : 'success'
                        }
                        className="mb-3"
                      />
                      <div className="d-grid">
                        <Button
                          variant="primary"
                          size="sm"
                          className="btn-icon"
                          onClick={handlePurchaseMore}
                        >
                          <FaSearch className="me-1" /> Purchase More Searches
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="user-account-card dashboard-card mt-4">
                  <Card.Body className="p-4">
                    <h5 className="d-flex align-items-center mb-3">
                      <FaBell className="settings-icon me-2" />
                      Recent Notifications
                    </h5>
                    {notifications && notifications.length > 0 ? (
                      <div className="notification-list">
                        {notifications
                          .slice(0, 3)
                          .map((notification, index) => (
                            <div
                              key={index}
                              className="notification-item d-flex align-items-start mb-3 pb-3 border-bottom"
                            >
                              <div
                                className={`notification-icon bg-${notification.type || 'light'} bg-opacity-10 me-3`}
                              >
                                <FaInfoCircle
                                  className={`text-${notification.type || 'primary'}`}
                                />
                              </div>
                              <div>
                                <h6 className="mb-1 fs-6">
                                  {notification.title || 'System Notification'}
                                </h6>
                                <p className="mb-1 small text-muted">
                                  {notification.message ||
                                    'You have a new notification'}
                                </p>
                                <small className="text-muted">
                                  {notification.timestamp
                                    ? formatDate(notification.timestamp)
                                    : 'Recently'}
                                </small>
                              </div>
                            </div>
                          ))}
                        {notifications.length > 3 && (
                          <Button
                            variant="link"
                            className="p-0 text-primary"
                            onClick={() => setActiveTab('notifications')}
                            aria-label="View all notifications"
                          >
                            View all notifications
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted small mb-0">
                        You don't have any notifications
                      </p>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={8}>
                <Card className="user-account-card dashboard-card">
                  <Card.Header className="bg-transparent">
                    <Tabs
                      activeKey={activeTab}
                      onSelect={(k) => setActiveTab(k)}
                      className="nav-tabs"
                      role="tablist"
                    >
                      <Tab
                        eventKey="profile"
                        title={
                          <>
                            <FaUser className="me-2" />
                            Profile
                          </>
                        }
                        role="tab"
                        aria-label="Profile settings"
                      />
                      <Tab
                        eventKey="payments"
                        title={
                          <>
                            <FaCreditCard className="me-2" />
                            Payments
                          </>
                        }
                        role="tab"
                        aria-label="Payment history"
                      />
                      <Tab
                        eventKey="security"
                        title={
                          <>
                            <FaShieldAlt className="me-2" />
                            Security
                          </>
                        }
                        role="tab"
                        aria-label="Security settings"
                      />
                      <Tab
                        eventKey="notifications"
                        title={
                          <>
                            <FaBell className="me-2" />
                            Notifications
                          </>
                        }
                        role="tab"
                        aria-label="Notification settings"
                      />
                    </Tabs>
                  </Card.Header>

                  <Card.Body>
                    {activeTab === 'profile' && (
                      <div className="tab-content">
                        <h5 className="mb-4">Personal Information</h5>
                        <Form onSubmit={handleSubmit}>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label className="form-label">
                                  <FaUser className="me-2" />
                                  Display Name
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={displayName}
                                  onChange={(e) =>
                                    setDisplayName(e.target.value)
                                  }
                                  placeholder="Enter your name"
                                  required
                                  className="form-control"
                                  aria-required="true"
                                />
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label className="form-label">
                                  <FaPhone className="me-2" />
                                  Phone Number
                                </Form.Label>
                                <InputGroup>
                                  <InputGroup.Text id="basic-addon1">
                                    +
                                  </InputGroup.Text>
                                  <Form.Control
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="form-control"
                                    aria-describedby="basic-addon1"
                                  />
                                </InputGroup>
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-4">
                            <Form.Label className="form-label">
                              <FaInfoCircle className="me-2" />
                              Email Address
                            </Form.Label>
                            <Form.Control
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                              className="form-control"
                              aria-required="true"
                            />
                          </Form.Group>

                          <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                            <Button
                              variant="primary"
                              type="submit"
                              disabled={loading}
                              className="btn-icon px-4 py-2"
                              aria-label="Save profile changes"
                            >
                              {loading ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <FaSave className="me-2" /> Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </Form>
                      </div>
                    )}

                    {activeTab === 'payments' && (
                      <div className="tab-content">
                        <h5 className="mb-4">
                          Payment History & Search Credits
                        </h5>

                        <Card className="bg-light border-0 mb-4">
                          <Card.Body>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <div className="d-flex align-items-center">
                                <div className="settings-icon-container me-3">
                                  <FaSearch className="settings-icon" />
                                </div>
                                <div>
                                  <h6 className="mb-1">Available Searches</h6>
                                  <p className="mb-0 fw-bold">
                                    {searchLimit - searchesUsed} remaining
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handlePurchaseMore}
                              >
                                <FaDollarSign className="me-1" /> Buy More
                              </Button>
                            </div>

                            <ProgressBar
                              now={getSearchUsagePercentage()}
                              variant={
                                getSearchUsagePercentage() >= 90
                                  ? 'danger'
                                  : getSearchUsagePercentage() >= 70
                                    ? 'warning'
                                    : 'success'
                              }
                              className="mb-2"
                            />
                            <small className="text-muted">
                              {searchesUsed} of {searchLimit} searches used
                            </small>
                          </Card.Body>
                        </Card>

                        {paymentHistory && paymentHistory.length > 0 ? (
                          <>
                            <h6 className="mb-3 d-flex align-items-center">
                              <FaFileInvoiceDollar className="me-2" /> Recent
                              Purchases
                            </h6>
                            <div className="table-responsive">
                              <Table hover className="payment-history-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Searches</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paymentHistory.map((payment, index) => (
                                    <tr key={index}>
                                      <td>
                                        {formatDate(
                                          payment.timestamp?.toDate?.() ||
                                            payment.date
                                        )}
                                      </td>
                                      <td>{payment.productName}</td>
                                      <td>${payment.amount.toFixed(2)}</td>
                                      <td>+{payment.searchesAdded}</td>
                                      <td>
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 text-primary"
                                          onClick={() =>
                                            handleViewPayment(payment)
                                          }
                                        >
                                          View Details
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </>
                        ) : (
                          <Card className="border-0 bg-light">
                            <Card.Body className="text-center py-4">
                              <FaFileInvoiceDollar
                                className="text-muted mb-3"
                                size={30}
                              />
                              <h5>No Purchase History</h5>
                              <p className="text-muted mb-3">
                                You haven't made any purchases yet
                              </p>
                              <Button
                                variant="primary"
                                onClick={handlePurchaseMore}
                                className="btn-icon"
                              >
                                <FaSearch className="me-2" /> Buy VIN Searches
                              </Button>
                            </Card.Body>
                          </Card>
                        )}

                        <div className="text-center mt-4">
                          <p className="mb-2">Need more searches?</p>
                          <Button
                            variant="outline-primary"
                            size="lg"
                            onClick={handlePurchaseMore}
                            className="btn-icon px-4"
                          >
                            <FaSearch className="me-2" /> View Pricing Options
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'security' && (
                      <div className="tab-content">
                        <h5 className="mb-4">Security Settings</h5>

                        <Card className="border-0 shadow-sm mb-4">
                          <Card.Body className="p-4">
                            <h6 className="d-flex align-items-center mb-4">
                              <FaKey className="settings-icon me-2" />
                              Change Password
                            </h6>

                            <Form onSubmit={handleSubmit}>
                              <Form.Group className="mb-3">
                                <Form.Label className="form-label">
                                  <FaLock className="me-2" />
                                  Current Password
                                </Form.Label>
                                <Form.Control
                                  type="password"
                                  value={currentPassword}
                                  onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                  }
                                  placeholder="Enter your current password"
                                  className="form-control"
                                  aria-required="true"
                                />
                                <Form.Text className="text-muted">
                                  Required to change your password
                                </Form.Text>
                              </Form.Group>

                              <Row>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <Form.Label className="form-label">
                                      <FaLock className="me-2" />
                                      New Password
                                    </Form.Label>
                                    <OverlayTrigger
                                      placement="right"
                                      delay={{ show: 250, hide: 400 }}
                                      overlay={(props) =>
                                        renderTooltip(
                                          props,
                                          'Password must be at least 8 characters'
                                        )
                                      }
                                    >
                                      <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                          setPassword(e.target.value)
                                        }
                                        placeholder="New password"
                                        autoComplete="new-password"
                                        className="form-control"
                                        aria-describedby="passwordHelp"
                                      />
                                    </OverlayTrigger>

                                    {password && (
                                      <div className="mt-2">
                                        <small className="d-flex justify-content-between mb-1">
                                          <span>Password Strength</span>
                                          <span>
                                            {passwordStrength < 50
                                              ? 'Weak'
                                              : passwordStrength < 75
                                                ? 'Medium'
                                                : 'Strong'}
                                          </span>
                                        </small>
                                        <ProgressBar
                                          now={passwordStrength}
                                          variant={getPasswordStrengthColor()}
                                          className="password-strength-meter"
                                        />
                                      </div>
                                    )}
                                  </Form.Group>
                                </Col>

                                <Col md={6}>
                                  <Form.Group className="mb-4">
                                    <Form.Label className="form-label">
                                      <FaLock className="me-2" />
                                      Confirm New Password
                                    </Form.Label>
                                    <Form.Control
                                      type="password"
                                      value={confirmPassword}
                                      onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                      }
                                      placeholder="Confirm new password"
                                      autoComplete="new-password"
                                      className="form-control"
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Form>
                          </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm mb-4">
                          <Card.Body className="p-4">
                            <h6 className="d-flex align-items-center mb-4">
                              <FaFingerprint className="settings-icon me-2" />
                              Two-Factor Authentication
                            </h6>

                            <div className="d-flex align-items-center justify-content-between mb-4">
                              <div>
                                <h6 className="mb-1">Authenticator App</h6>
                                <p className="text-muted mb-0 small">
                                  Use an authentication app to generate
                                  verification codes
                                </p>
                              </div>
                              <Form.Check
                                type="switch"
                                id="2fa-switch"
                                aria-label="Toggle authenticator app"
                              />
                            </div>

                            <div className="d-flex align-items-center justify-content-between mb-4">
                              <div>
                                <h6 className="mb-1">SMS Authentication</h6>
                                <p className="text-muted mb-0 small">
                                  Receive verification codes via SMS
                                </p>
                              </div>
                              <Form.Check
                                type="switch"
                                id="sms-switch"
                                aria-label="Toggle SMS authentication"
                              />
                            </div>
                          </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm">
                          <Card.Body className="p-4">
                            <h6 className="d-flex align-items-center mb-4">
                              <FaShieldAlt className="settings-icon me-2" />
                              Account Security
                            </h6>

                            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                              <div>
                                <h6 className="mb-1">Login Notifications</h6>
                                <p className="text-muted mb-0 small">
                                  Receive alerts when your account is accessed
                                  from a new device
                                </p>
                              </div>
                              <Form.Check
                                type="switch"
                                id="login-alerts-switch"
                                defaultChecked
                                aria-label="Toggle login notifications"
                              />
                            </div>

                            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                              <div>
                                <h6 className="mb-1">Remember Sessions</h6>
                                <p className="text-muted mb-0 small">
                                  Stay logged in on trusted devices
                                </p>
                              </div>
                              <Form.Check
                                type="switch"
                                id="sessions-switch"
                                defaultChecked
                                aria-label="Toggle remember sessions"
                              />
                            </div>

                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <h6 className="mb-1">Auto Logout</h6>
                                <p className="text-muted mb-0 small">
                                  Automatically log out after period of
                                  inactivity
                                </p>
                              </div>
                              <Form.Select
                                className="form-select w-auto"
                                value={selectedTimeout}
                                onChange={(e) =>
                                  setSelectedTimeout(e.target.value)
                                }
                                aria-label="Select auto logout duration"
                              >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="120">2 hours</option>
                                <option value="240">4 hours</option>
                              </Form.Select>
                            </div>
                          </Card.Body>
                        </Card>

                        <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                          <Button
                            variant="primary"
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn-icon px-4 py-2"
                            aria-label="Save security settings"
                          >
                            <FaSave className="me-2" /> Save Security Settings
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'notifications' && (
                      <div className="tab-content">
                        <h5 className="mb-4">Notification Settings</h5>

                        <Form>
                          <Card className="border-0 shadow-sm mb-4">
                            <Card.Body className="p-4">
                              <h6 className="d-flex align-items-center mb-4">
                                <FaEnvelope className="settings-icon me-2" />
                                Email Notifications
                              </h6>

                              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                <div>
                                  <p className="mb-0">Search Limit Alerts</p>
                                  <small className="text-muted">
                                    Notify when nearing search limit
                                  </small>
                                </div>
                                <Form.Check
                                  type="switch"
                                  id="search-limit-switch"
                                  defaultChecked
                                  aria-label="Toggle search limit alerts"
                                />
                              </div>

                              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                <div>
                                  <p className="mb-0">Newsletter</p>
                                  <small className="text-muted">
                                    Receive our monthly newsletter
                                  </small>
                                </div>
                                <Form.Check
                                  type="switch"
                                  id="newsletter-switch"
                                  defaultChecked
                                  aria-label="Toggle newsletter subscription"
                                />
                              </div>

                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                  <p className="mb-0">Promotional Emails</p>
                                  <small className="text-muted">
                                    Receive special offers and promotions
                                  </small>
                                </div>
                                <Form.Check
                                  type="switch"
                                  id="promo-switch"
                                  aria-label="Toggle promotional emails"
                                />
                              </div>
                            </Card.Body>
                          </Card>

                          <Card className="border-0 shadow-sm mb-4">
                            <Card.Body className="p-4">
                              <h6 className="d-flex align-items-center mb-4">
                                <FaBell className="settings-icon me-2" />
                                Recent Notifications
                              </h6>

                              {notifications && notifications.length > 0 ? (
                                <ListGroup variant="flush">
                                  {notifications.map((notification, index) => (
                                    <ListGroup.Item
                                      key={index}
                                      className="notification-item px-0 py-3 border-bottom"
                                    >
                                      <div className="d-flex">
                                        <div
                                          className={`notification-icon bg-${notification.type || 'light'} bg-opacity-10 me-3`}
                                        >
                                          <FaBell
                                            className={`text-${notification.type || 'primary'}`}
                                          />
                                        </div>
                                        <div>
                                          <h6 className="mb-1">
                                            {notification.title ||
                                              'System Notification'}
                                          </h6>
                                          <p className="mb-1 small">
                                            {notification.message ||
                                              'You have a new notification'}
                                          </p>
                                          <small className="text-muted">
                                            {notification.timestamp
                                              ? formatDate(
                                                  notification.timestamp
                                                )
                                              : 'Recently'}
                                          </small>
                                        </div>
                                        <Button
                                          variant="link"
                                          className="ms-auto text-muted p-0"
                                          title="Mark as read"
                                          aria-label="Mark notification as read"
                                        >
                                          <FaCheck />
                                        </Button>
                                      </div>
                                    </ListGroup.Item>
                                  ))}
                                </ListGroup>
                              ) : (
                                <Card className="border-0 bg-light">
                                  <Card.Body className="text-center py-4">
                                    <FaBell
                                      className="text-muted mb-3"
                                      size={30}
                                    />
                                    <h6>No New Notifications</h6>
                                    <p className="text-muted mb-0">
                                      You're all caught up!
                                    </p>
                                  </Card.Body>
                                </Card>
                              )}

                              {notifications && notifications.length > 0 && (
                                <div className="d-flex justify-content-center mt-3">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="btn-icon"
                                    aria-label="Mark all notifications as read"
                                  >
                                    Mark all as read
                                  </Button>
                                </div>
                              )}
                            </Card.Body>
                          </Card>

                          <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                            <Button
                              variant="primary"
                              type="submit"
                              className="btn-icon px-4 py-2"
                              aria-label="Save notification preferences"
                            >
                              <FaSave className="me-2" /> Save Notification
                              Preferences
                            </Button>
                          </div>
                        </Form>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>

          {/* Photo Upload Modal */}
          <Modal
            show={showPhotoModal}
            onHide={() => setShowPhotoModal(false)}
            centered
            className="user-account-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>Update Profile Photo</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {photoPreview && (
                <div className="image-preview-container text-center mb-3">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    thumbnail
                    loading="lazy"
                  />
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowPhotoModal(false)}
                className="btn-icon"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={uploadProfilePhoto}
                disabled={loading}
                className="btn-icon"
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Uploading...
                  </>
                ) : (
                  'Save Photo'
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Delete Account Modal */}
          <Modal
            show={showDeleteModal}
            onHide={() => setShowDeleteModal(false)}
            centered
            className="user-account-modal"
          >
            <Modal.Header closeButton className="bg-danger text-white">
              <Modal.Title>Delete Account</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="text-center mb-4">
                <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                  <FaTrash size={30} className="text-danger" />
                </div>
                <h5>Are you sure you want to delete your account?</h5>
                <p className="text-muted">
                  This action cannot be undone. All your data will be
                  permanently removed.
                </p>
              </div>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Type "DELETE" to confirm</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="DELETE"
                    className="form-control"
                    aria-label="Confirm account deletion"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    className="form-control"
                    aria-label="Enter password to confirm deletion"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                onClick={() => setShowDeleteModal(false)}
                className="btn-icon"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="btn-icon"
                aria-label="Confirm account deletion"
              >
                Delete Account
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Activity History Modal */}
          <Modal
            show={showActivityModal}
            onHide={() => setShowActivityModal(false)}
            size="lg"
            centered
            className="user-account-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>Activity History</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {activityHistory && activityHistory.length > 0 ? (
                <div className="p-2">
                  {activityHistory.map((activity, index) => (
                    <div key={index} className="timeline-item py-2 mb-3">
                      <div className="timeline-circle"></div>
                      <h6 className="mb-1">
                        {activity.action === 'profile_update' &&
                          'Profile Updated'}
                        {activity.action === 'photo_update' && 'Photo Updated'}
                        {activity.action === 'login' && 'Account Login'}
                        {activity.action === 'payment' && 'Purchase Made'}
                        {activity.action === 'search' && 'VIN Search'}
                        {!activity.action && 'Account Activity'}
                      </h6>
                      <p className="mb-0 small">
                        {activity.details || 'No details available'}
                      </p>
                      <small className="text-muted">
                        {formatDate(activity.timestamp)}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <FaHistory className="text-muted mb-3" size={40} />
                  <h5>No Activity Yet</h5>
                  <p className="text-muted">
                    Your activity history will appear here
                  </p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowActivityModal(false)}
                className="btn-icon"
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Payment Details Modal */}
          <Modal
            show={showPaymentModal}
            onHide={() => setShowPaymentModal(false)}
            centered
            className="user-account-modal"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                <FaFileInvoiceDollar className="me-2" />
                Payment Details
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedPayment ? (
                <div>
                  <div className="text-center mb-4">
                    <Badge bg="success" className="px-3 py-2">
                      <FaCheckCircle className="me-2" />
                      Payment Successful
                    </Badge>
                  </div>

                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between py-3">
                      <strong>Transaction Date:</strong>
                      <span>
                        {formatDate(
                          selectedPayment.timestamp?.toDate?.() ||
                            selectedPayment.date
                        )}
                      </span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between py-3">
                      <strong>Plan:</strong>
                      <span>{selectedPayment.productName}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between py-3">
                      <strong>Amount:</strong>
                      <span>${selectedPayment.amount.toFixed(2)}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between py-3">
                      <strong>Searches Added:</strong>
                      <span>{selectedPayment.searchesAdded}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between py-3">
                      <strong>Transaction ID:</strong>
                      <span className="text-muted">
                        {selectedPayment.paymentId?.substring(0, 12)}...
                      </span>
                    </ListGroup.Item>
                  </ListGroup>

                  <div className="text-center mt-4">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                    >
                      <FaFileInvoiceDollar className="me-2" />
                      Download Receipt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading payment details...</p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Close
              </Button>
              {selectedPayment && (
                <Button variant="primary" onClick={handlePurchaseMore}>
                  <FaSearch className="me-2" /> Buy More Searches
                </Button>
              )}
            </Modal.Footer>
          </Modal>
        </main>
      </div>
    </>
  );
};

export default UserAccount;



