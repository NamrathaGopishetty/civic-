# 💇‍♀️ Salon Appointment Booking System (C Language)

## 📌 Project Overview

The **Salon Appointment Booking System** is a console-based application developed in **C programming language**.
It allows customers to book salon appointments, choose services based on gender, and automatically generate a bill including tax.

The system manages multiple appointments, provides categorized salon services, and calculates the final payment amount.

This project demonstrates the use of:

* Structures
* Arrays
* Functions
* Conditional statements
* Loops
* Basic billing logic

---

## ✨ Features

* 📅 Book multiple salon appointments
* 👩‍🦰 Gender-based service categories (Male / Female)
* 💄 Multiple service selections
* 🧾 Automatic bill generation
* 💰 Tax calculation (18%)
* 💳 Payment mode selection (Cash / Card / UPI)

---

## 🧱 Project Structure

The system uses structured programming with the following main components:

### 1️⃣ SubService

Stores the name and price of each salon service.

### 2️⃣ ServiceCategory

Groups multiple services into categories like:

* Hair Services
* Skin & Facial Treatments
* Makeup Services
* Hair Removal
* Nail Care
* Body Care

### 3️⃣ Booking

Stores customer information including:

* Name
* Age
* Gender
* Contact number
* Appointment date and time
* Selected services
* Payment mode
* Billing details

---

## 🛠 Technologies Used

* **C Programming Language**
* **Standard Libraries**

  * `stdio.h`
  * `stdlib.h`
  * `string.h`

---

## 📊 Billing System

The bill is generated automatically with:

Subtotal = Sum of selected services
Tax = 18% GST
Final Amount = Subtotal + Tax

Example:

Subtotal      : ₹3000
Tax (18%)     : ₹540
Total Amount  : ₹3540

---

## ▶️ How to Run the Program

### Step 1: Compile the program

```bash
gcc salon_booking.c -o salon
```

### Step 2: Run the program

```bash
./salon
```

or (Windows)

```bash
salon.exe
```

---

## 🧪 Example Flow

1. Enter number of appointments
2. Enter customer details
3. Choose services from categories
4. Select payment mode
5. System generates final bill

---

## 📚 Learning Outcomes

This project helped practice:

* Structs in C
* Data organization
* Menu driven programs
* Billing system logic
* Real-world application development

---

## 🚀 Future Improvements

Possible improvements include:

* File storage for bookings
* GUI interface
* Database integration
* Online appointment booking
* Admin dashboard

---

## 👩‍💻 Author

**Namratha**

Computer Science Student
Interested in **Software Development, Data Science and AI**.

---
