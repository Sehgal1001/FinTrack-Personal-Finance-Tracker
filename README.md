# 💰 FinTrack – Personal Finance Tracker

<p align="center">
  <strong>A Smart & Modern Personal Finance Management Dashboard</strong>
</p>

<p align="center">
  <a href="https://sehgal1001.github.io/FinTrack-Personal-Finance-Tracker/">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20Project-brightgreen?style=for-the-badge&logo=github" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/HTML5-Frontend-orange?style=for-the-badge&logo=html5" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-Styling-blue?style=for-the-badge&logo=css3" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-yellow?style=for-the-badge&logo=javascript" alt="JavaScript">
</p>

---

## 🌐 Live Demo

**Explore the project here:**

🔗 https://sehgal1001.github.io/FinTrack-Personal-Finance-Tracker/

---

## 📌 About The Project

**FinTrack** is a modern, responsive Personal Finance Tracker developed using HTML5, CSS3, and Vanilla JavaScript.

It is designed to help users manage their daily financial activities, monitor income and expenses, set monthly budgets, and understand their spending habits through interactive charts and financial reports.

The application provides a clean and user-friendly dashboard where users can manage their personal finances efficiently.

It uses browser LocalStorage to maintain transaction records without requiring a backend server or database.

## ✨ Features

### 📊 1. Interactive Dashboard
- View total account balance.
- Monitor monthly income and expenses.
- Calculate savings rate.
- View recent transactions.
- Visualize financial activity.

### 💳 2. Transaction Management
- Add new income and expense transactions.
- Edit existing transactions.
- Delete transactions.
- Search transactions by description or category.
- Filter transactions by type, category, and month.

### 🎯 3. Monthly Budget Management
- Create monthly budgets.
- Set category-wise spending limits.
- Monitor expenses against budget limits.
- Identify overspending.

### 📈 4. Reports & Analytics
- Visualize income and expenses.
- View monthly financial comparisons.
- Analyze category-wise spending.
- Generate monthly financial insights.
- Download transaction reports in CSV format.

### 💱 5. Multi-Currency Support
- Supports INR, USD, EUR, and GBP.
- Currency conversion using the Frankfurter API.
- Display financial data in different currencies.
- Original transaction amounts remain stored in INR.

### 🌙 6. Dark Mode
- Switch between light and dark themes.
- Enjoy a comfortable user experience.

### 💾 7. Data Management
- Automatically save transaction records using LocalStorage.
- Export financial data in JSON format.
- Maintain data in the current browser.

### 📱 8. Responsive Design
- Mobile-friendly interface.
- Responsive dashboard layout.
- Easy navigation and user interaction.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive design |
| JavaScript | Application logic and functionality |
| Chart.js | Interactive financial charts |
| LocalStorage | Browser-based data persistence |
| Frankfurter API | Currency exchange rates |
| Google Fonts | Typography |

---

## 📂 Project Structure

```text
FinTrack-Personal-Finance-Tracker/
│
├── index.html
├── README.md
│
├── css/
│   └── style.css
│
└── js/
    └── app.js
```

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Sehgal1001/FinTrack-Personal-Finance-Tracker.git
```

### 2. Navigate to the Project Folder

```bash
cd FinTrack-Personal-Finance-Tracker
```

### 3. Open in VS Code

```bash
code .
```

### 4. Run the Application

- Open the project in VS Code.
- Install the Live Server extension if you haven't already.
- Right-click on `index.html`.
- Select **Open with Live Server**.

The application will open in your browser.

**Note:** An internet connection is required for external resources such as Chart.js, Google Fonts, and currency exchange rates.

---

## 🔌 API Integration

FinTrack uses the **Frankfurter API** to retrieve reference exchange rates.

API Endpoint:

```text
https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP
```

The API provides exchange rates for displaying financial information in different currencies.

Original transaction amounts are stored in INR and are not modified when the display currency changes.

---

## 💾 Data Storage

The application uses browser **LocalStorage** to store financial records.

Storage Key:

```javascript
fintrack_data_v1
```

### Important Information
- Data is saved in the current browser.
- No backend database is required.
- Data does not automatically synchronize between devices or browsers.
- Clearing browser site data may remove stored records.
- Export a JSON backup before clearing browser data.

---

## 🎯 Project Objectives

The main objectives of this project are:

- To simplify personal financial management.
- To help users track income and expenses.
- To encourage better budgeting habits.
- To provide clear financial insights through charts.
- To demonstrate practical frontend development skills.
- To understand JavaScript DOM manipulation and LocalStorage.

---

## 🔮 Future Improvements

Some features that could be added in future versions:

- User authentication and login system.
- Backend integration with a database.
- Cloud-based financial data synchronization.
- Recurring transactions.
- Custom date-range reports.
- Import financial data from JSON.
- Advanced financial analytics.
- Automated testing and accessibility improvements.

---

## 👨‍💻 Developer

**Aniket Sahgal**

B.Tech Computer Science & Engineering

- GitHub: [@Sehgal1001](https://github.com/Sehgal1001)
- LinkedIn: [Connect on LinkedIn](https://www.linkedin.com/in/aniket-sahgal-297a67276/)

---

## ⭐ Support

If you find this project useful or interesting, please consider giving it a ⭐ on GitHub.

Your support and feedback are always appreciated!

---

<p align="center">
  <strong>Built with ❤️ using HTML, CSS & JavaScript</strong>
</p>

<p align="center">
  © 2026 FinTrack – Personal Finance Tracker
</p>
