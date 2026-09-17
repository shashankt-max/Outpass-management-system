console.log("JS Loaded");

// ========================================
// CURRENT USER
// ========================================

function getCurrentUser() {
    return sessionStorage.getItem("loggedInUser");
}

// ========================================
// PAGE ELEMENTS
// ========================================

const form = document.getElementById("leaveForm");
const requestList = document.getElementById("requestList");

// ========================================
// CHECK ADMIN PAGE
// ========================================

function isAdminPage() {
    return document.title === "Admin Panel";
}

// ========================================
// GET ALL REQUESTS
// ========================================

function getRequests() {
    return JSON.parse(localStorage.getItem("requests")) || [];
}

// ========================================
// SAVE REQUESTS
// ========================================

function saveRequests(requests) {
    localStorage.setItem("requests", JSON.stringify(requests));
}

// ========================================
// DISPLAY REQUESTS
// ========================================

function displayRequests() {

    const requestListElement =
        document.getElementById("requestList");

    if (!requestListElement) return;

    let requests = getRequests();

    const adminPage = isAdminPage();
    const currentUser = getCurrentUser();

    // ========================================
    // STUDENT FILTER
    // ========================================

    if (!adminPage) {

        requests = requests.filter(function(request) {

            // Keep old requests visible
            if (!request.student) {
                return true;
            }

            return request.student === currentUser;
        });
    }

    // ========================================
    // ADMIN DISPLAY
    // ========================================

    if (adminPage) {
        displayAdminRequests(requests);
        return;
    }

    // ========================================
    // STUDENT DISPLAY
    // ========================================

    requestListElement.innerHTML = "";

    if (requests.length === 0) {

        requestListElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>

                <h3>No Outpass Requests</h3>

                <p>
                    You have not submitted any outpass requests yet.
                </p>
            </div>
        `;

        return;
    }

    requests.forEach(function(request) {

        // Old requests
        if (!request.status) {
            request.status = "Pending";
        }

        const requestCard =
            document.createElement("div");

        requestCard.classList.add("request-card");

        const statusClass =
            request.status === "Approved"
                ? "status-approved"
                : request.status === "Rejected"
                    ? "status-rejected"
                    : "status-pending";

        requestCard.innerHTML = `
            <div class="request-card-header">

                <div>
                    <h3>
                        Outpass Request
                    </h3>

                    <span class="request-id">
                        #${request.id}
                    </span>
                </div>

                <span class="status ${statusClass}">
                    ${request.status}
                </span>

            </div>

            <div class="request-details">

                <div class="detail-item">

                    <strong>
                        📝 Reason
                    </strong>

                    <span>
                        ${request.reason || "-"}
                    </span>

                </div>

                <div class="detail-item">

                    <strong>
                        📍 Destination
                    </strong>

                    <span>
                        ${request.destination || "-"}
                    </span>

                </div>

                <div class="detail-item">

                    <strong>
                        🛫 Departure
                    </strong>

                    <span>
                        ${request.departureDate || "-"}
                        at
                        ${request.departureTime || "-"}
                    </span>

                </div>

                <div class="detail-item">

                    <strong>
                        🏠 Return
                    </strong>

                    <span>
                        ${request.returnDate || "-"}
                        at
                        ${request.returnTime || "-"}
                    </span>

                </div>

            </div>

            ${
                request.status === "Approved"

                ? `
                    <button
                        class="generate-otp-btn"
                        onclick="generateOTP('${request.id}')">

                        🔐 Generate OTP

                    </button>
                `

                : `
                    <p class="otp-unavailable">

                        🔐 OTP will be available after
                        the request is approved.

                    </p>
                `
            }

            <div id="otp-${request.id}"></div>
        `;

        requestListElement.appendChild(requestCard);

        // Show saved OTP
        if (
            request.status === "Approved" &&
            request.otp
        ) {
            displayOTP(request);
        }
    });

    // ========================================
    // SAVE MISSING STATUSES
    // ========================================

    let allRequests = getRequests();

    allRequests.forEach(function(request) {

        if (!request.status) {
            request.status = "Pending";
        }
    });

    saveRequests(allRequests);
}

// ========================================
// ADMIN REQUEST DISPLAY
// ========================================

function displayAdminRequests(requests) {

    const requestListElement =
        document.getElementById("requestList");

    const emptyState =
        document.getElementById("emptyState");

    const searchInput =
        document.getElementById("searchRequests");

    const statusFilter =
        document.getElementById("statusFilter");

    if (!requestListElement) return;

    // ========================================
    // SEARCH
    // ========================================

    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

    // ========================================
    // FILTER
    // ========================================

    const filter =
        statusFilter
            ? statusFilter.value
            : "All";


    // ========================================
    // FILTER REQUESTS
    // ========================================

    const filteredRequests =
        requests.filter(function(request) {

            const student =
                (request.student || "").toLowerCase();

            const reason =
                (request.reason || "").toLowerCase();

            const destination =
                (request.destination || "").toLowerCase();

            const status =
                request.status || "Pending";

            const matchesSearch =
                student.includes(search) ||
                reason.includes(search) ||
                destination.includes(search);

            const matchesFilter =
                filter === "All" ||
                status === filter;

            return matchesSearch && matchesFilter;
        });

    // ========================================
    // CLEAR LIST
    // ========================================

    requestListElement.innerHTML = "";

    // ========================================
    // VISIBLE COUNT
    // ========================================

    const visibleCount =
        document.getElementById(
            "visibleRequestCount"
        );

    if (visibleCount) {

        visibleCount.textContent =
            filteredRequests.length;
    }

    // ========================================
    // EMPTY STATE
    // ========================================

    if (filteredRequests.length === 0) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        updateAdminStatistics(requests);

        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    // ========================================
    // DISPLAY ADMIN REQUESTS
    // ========================================

    filteredRequests.forEach(function(request) {

        if (!request.status) {
            request.status = "Pending";
        }

        const status = request.status;

        const requestCard =
            document.createElement("div");

        requestCard.classList.add(
            "admin-request-card"
        );

        requestCard.innerHTML = `

            <!-- REQUEST HEADER -->

            <div class="request-top">

                <div class="request-title">

                    <span class="request-number">
                        #${request.id}
                    </span>

                    <h4>
                        ${request.reason || "Outpass Request"}
                    </h4>

                </div>

                <span class="request-status ${status.toLowerCase()}">
                    ${status}
                </span>

            </div>


            <!-- REQUEST DETAILS -->

            <div class="request-details">

                <div class="detail-item">

                    <span>
                        Student
                    </span>

                    <strong>
                        ${request.student || "Old Request"}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Destination
                    </span>

                    <strong>
                        ${request.destination || "-"}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Departure
                    </span>

                    <strong>
                        ${request.departureDate || "-"}
                        ${request.departureTime || ""}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Return
                    </span>

                    <strong>
                        ${request.returnDate || "-"}
                        ${request.returnTime || ""}
                    </strong>

                </div>

            </div>


            <!-- ADMIN ACTIONS -->

            <div class="request-actions">

                ${
                    status === "Pending"

                    ? `
                        <button
                            class="approve-btn"
                            onclick="approveRequest('${request.id}')">

                            ✓ Approve

                        </button>


                        <button
                            class="reject-btn"
                            onclick="rejectRequest('${request.id}')">

                            ✕ Reject

                        </button>
                    `

                    : ""
                }


                <button
                    class="delete-btn"
                    onclick="deleteRequest('${request.id}')">

                    🗑 Delete

                </button>

            </div>
        `;

        requestListElement.appendChild(requestCard);
    });

    // ========================================
    // UPDATE ADMIN STATISTICS
    // ========================================

    updateAdminStatistics(requests);
}

// ========================================
// ADMIN STATISTICS
// ========================================

function updateAdminStatistics(requests) {

    const total =
        requests.length;

    const pending =
        requests.filter(function(request) {

            return (
                request.status === "Pending" ||
                !request.status
            );

        }).length;

    const approved =
        requests.filter(function(request) {

            return request.status === "Approved";

        }).length;

    const rejected =
        requests.filter(function(request) {

            return request.status === "Rejected";

        }).length;


    const totalElement =
        document.getElementById("totalRequests");

    const pendingElement =
        document.getElementById("pendingRequests");

    const approvedElement =
        document.getElementById("approvedRequests");

    const rejectedElement =
        document.getElementById("rejectedRequests");


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (approvedElement) {
        approvedElement.textContent = approved;
    }

    if (rejectedElement) {
        rejectedElement.textContent = rejected;
    }
}

// ========================================
// GENERATE OTP - STUDENT
// ========================================

function generateOTP(id) {

    let requests = getRequests();

    let request =
        requests.find(function(request) {

            return (
                String(request.id) ===
                String(id)
            );

        });

    if (!request) {

        alert("Request not found!");

        return;
    }

    const currentUser =
        getCurrentUser();

    // ========================================
    // CHECK OWNERSHIP
    // ========================================

    if (
        request.student &&
        request.student !== currentUser
    ) {

        alert(
            "You are not allowed to access this request."
        );

        return;
    }

    // ========================================
    // OTP ONLY AFTER APPROVAL
    // ========================================

    if (request.status !== "Approved") {

        alert(
            "OTP can only be generated after your outpass is approved."
        );

        return;
    }

    // ========================================
    // GENERATE ONLY ONCE
    // ========================================

    if (!request.otp) {

        let otp =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();

        request.otp =
            otp.substring(0, 3) +
            " " +
            otp.substring(3);

        saveRequests(requests);
    }

    displayOTP(request);
}

// ========================================
// DISPLAY OTP
// ========================================

function displayOTP(request) {

    const otpBox =
        document.getElementById(
            "otp-" + request.id
        );

    if (!otpBox) return;

    otpBox.innerHTML = `

        <div class="otp-box">

            <h3>
                OTP for Arch Gate
            </h3>

            <hr>

            <p>

                <strong>
                    Out Date:
                </strong>

                ${request.departureDate}


                <strong>
                    In Date:
                </strong>

                ${request.returnDate}

            </p>

            <h2>
                ${request.otp}
            </h2>

        </div>
    `;
}

// ========================================
// APPROVE REQUEST
// ========================================

function approveRequest(id) {

    if (getCurrentUser() !== "admin") {

        alert(
            "Only an admin can approve requests."
        );

        return;
    }

    let requests = getRequests();

    let found = false;

    requests.forEach(function(request) {

        if (
            String(request.id) ===
            String(id)
        ) {

            request.status = "Approved";

            found = true;
        }
    });

    if (found) {

        saveRequests(requests);

        alert("Request Approved!");

        displayRequests();

        updateDashboardStats();

    } else {

        alert("Request not found!");
    }
}

// ========================================
// REJECT REQUEST
// ========================================

function rejectRequest(id) {

    if (getCurrentUser() !== "admin") {

        alert(
            "Only an admin can reject requests."
        );

        return;
    }

    let requests = getRequests();

    let found = false;

    requests.forEach(function(request) {

        if (
            String(request.id) ===
            String(id)
        ) {

            request.status = "Rejected";

            // Remove OTP
            delete request.otp;

            found = true;
        }
    });

    if (found) {

        saveRequests(requests);

        alert("Request Rejected!");

        displayRequests();

        updateDashboardStats();

    } else {

        alert("Request not found!");
    }
}

// ========================================
// DELETE REQUEST
// ========================================

function deleteRequest(id) {

    if (getCurrentUser() !== "admin") {

        alert(
            "Only an admin can delete requests."
        );

        return;
    }

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this request?"
        );

    if (!confirmDelete) {
        return;
    }

    let requests = getRequests();

    requests =
        requests.filter(function(request) {

            return (
                String(request.id) !==
                String(id)
            );

        });

    saveRequests(requests);

    displayRequests();

    updateDashboardStats();
}

// ========================================
// STUDENT SUBMIT REQUEST
// ========================================

if (form) {

    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const currentUser =
                getCurrentUser();

            if (!currentUser) {

                alert(
                    "Please login before submitting an outpass."
                );

                window.location.href =
                    "index.html";

                return;
            }


            const reason =
                document
                    .getElementById("reason")
                    .value;

            const destination =
                document
                    .getElementById("destination")
                    .value;

            const departureDate =
                document
                    .getElementById("departureDate")
                    .value;

            const departureTime =
                document
                    .getElementById("departureTime")
                    .value;

            const returnDate =
                document
                    .getElementById("returnDate")
                    .value;

            const returnTime =
                document
                    .getElementById("returnTime")
                    .value;


            const request = {

                id: Date.now(),

                student: currentUser,

                reason: reason,

                destination: destination,

                departureDate: departureDate,

                departureTime: departureTime,

                returnDate: returnDate,

                returnTime: returnTime,

                status: "Pending"
            };


            let requests =
                getRequests();

            requests.push(request);

            saveRequests(requests);


            alert(
                "Request Submitted Successfully!"
            );


            form.reset();

            displayRequests();

            updateDashboardStats();
        }
    );
}

// ========================================
// STUDENT DATA
// ========================================

const students = {

    student1: {

        password: "student123",

        name: "Student 1",

        registrationNumber:
            "RA2411000001",

        department:
            "EEE",

        year:
            "2nd Year"
    },


    student2: {

        password: "student123",

        name: "Student 2",

        registrationNumber:
            "RA2411000002",

        department:
            "EEE",

        year:
            "2nd Year"
    },


    student3: {

        password: "student123",

        name: "Student 3",

        registrationNumber:
            "RA2411000003",

        department:
            "EEE",

        year:
            "2nd Year"
    }
};

// ========================================
// LOGIN SYSTEM
// ========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;

            const loginMessage =
                document.getElementById(
                    "loginMessage"
                );


            // ========================================
            // STUDENT LOGIN
            // ========================================

            if (
                students[username] &&
                students[username].password ===
                password
            ) {

                sessionStorage.setItem(
                    "loggedInUser",
                    username
                );

                window.location.href =
                    "dashboard.html";

                return;
            }


            // ========================================
            // ADMIN LOGIN
            // ========================================

            if (
                username === "admin" &&
                password === "admin123"
            ) {

                sessionStorage.setItem(
                    "loggedInUser",
                    "admin"
                );

                window.location.href =
                    "admin.html";

                return;
            }


            // ========================================
            // INVALID LOGIN
            // ========================================

            if (loginMessage) {

                loginMessage.textContent =
                    "Invalid username or password.";

                loginMessage.style.color =
                    "red";
            }
        }
    );
}

// ========================================
// LOGOUT
// ========================================

function logout() {

    sessionStorage.removeItem(
        "loggedInUser"
    );

    window.location.href =
        "index.html";
}

// ========================================
// STUDENT WELCOME MESSAGE
// ========================================

function updateWelcomeMessage() {

    const welcomeMessage =
        document.getElementById(
            "welcomeMessage"
        );

    if (!welcomeMessage) return;

    const currentUser =
        getCurrentUser();

    const student =
        students[currentUser];

    if (!student) return;


    welcomeMessage.textContent =
        "Welcome, " +
        student.name +
        " 👋";


    const registrationElement =
        document.getElementById(
            "studentRegistration"
        );

    if (registrationElement) {

        registrationElement.textContent =
            student.registrationNumber;
    }


    const departmentElement =
        document.getElementById(
            "studentDepartment"
        );

    if (departmentElement) {

        departmentElement.textContent =
            student.department;
    }


    const yearElement =
        document.getElementById(
            "studentYear"
        );

    if (yearElement) {

        yearElement.textContent =
            student.year;
    }
}

// ========================================
// DASHBOARD STATISTICS
// ========================================

function updateDashboardStats() {

    const totalRequestsElement =
        document.getElementById(
            "totalRequests"
        );

    const pendingRequestsElement =
        document.getElementById(
            "pendingRequests"
        );

    const approvedRequestsElement =
        document.getElementById(
            "approvedRequests"
        );

    const rejectedRequestsElement =
        document.getElementById(
            "rejectedRequests"
        );


    if (
        !totalRequestsElement &&
        !pendingRequestsElement &&
        !approvedRequestsElement &&
        !rejectedRequestsElement
    ) {
        return;
    }


    let requests =
        getRequests();

    const currentUser =
        getCurrentUser();


    // ========================================
    // ADMIN
    // ========================================

    if (currentUser === "admin") {

        updateAdminStatistics(requests);

        return;
    }


    // ========================================
    // STUDENT
    // ========================================

    if (currentUser) {

        requests =
            requests.filter(function(request) {

                return (
                    !request.student ||
                    request.student === currentUser
                );

            });
    }


    let pending = 0;
    let approved = 0;
    let rejected = 0;


    requests.forEach(function(request) {

        const status =
            request.status || "Pending";


        if (status === "Pending") {

            pending++;

        } else if (status === "Approved") {

            approved++;

        } else if (status === "Rejected") {

            rejected++;
        }
    });


    if (totalRequestsElement) {

        totalRequestsElement.textContent =
            requests.length;
    }

    if (pendingRequestsElement) {

        pendingRequestsElement.textContent =
            pending;
    }

    if (approvedRequestsElement) {

        approvedRequestsElement.textContent =
            approved;
    }

    if (rejectedRequestsElement) {

        rejectedRequestsElement.textContent =
            rejected;
    }
}

// ========================================
// ADMIN SEARCH + FILTER
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const searchInput =
            document.getElementById(
                "searchRequests"
            );

        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        // ========================================
        // SEARCH
        // ========================================

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                function() {

                    displayAdminRequests(
                        getRequests()
                    );
                }
            );
        }


        // ========================================
        // FILTER
        // ========================================

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                function() {

                    displayAdminRequests(
                        getRequests()
                    );
                }
            );
        }


        // ========================================
        // INITIAL LOAD
        // ========================================

        displayRequests();

        updateDashboardStats();

        updateWelcomeMessage();
    }
);

// ========================================
// AUTOMATIC REQUEST UPDATE
// ========================================

setInterval(
    function() {

        // Student
        if (
            document.getElementById("requestList") &&
            getCurrentUser() &&
            getCurrentUser() !== "admin"
        ) {

            displayRequests();
        }


        // Admin
        if (
            isAdminPage() &&
            getCurrentUser() === "admin"
        ) {

            displayAdminRequests(
                getRequests()
            );
        }


        updateDashboardStats();

    },
    1000
);

// ========================================
// STORAGE CHANGE
// ========================================

window.addEventListener(
    "storage",
    function(event) {

        if (event.key === "requests") {

            displayRequests();

            updateDashboardStats();
        }
    }
);