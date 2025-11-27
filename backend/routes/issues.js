// const express = require("express");
// const router = express.Router();
// const Issue = require("../models/Issue");
// const auth = require("../middleware/auth");

// // Cloudinary + Multer config
// const multer = require("multer");
// // const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// const cloudinary = require("../config/cloudinary");

// // Configure Storage for Cloudinary
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "civic-issues",
//     allowed_formats: ["jpg", "jpeg", "png", "mp4", "mov"],
//   },
// });

// const upload = multer({ storage: storage });

// /**
//  * @route POST /api/issues/create
//  * @desc Create a new issue
//  * @access Private (auth required)
//  */
// router.post(
//   "/create",
//   auth,
//   upload.array("media", 10), // max 10 files
//   async (req, res) => {
//     try {
//       const { description, category, priority, latitude, longitude, address } =
//         req.body;

//       if (!description || !category || !priority) {
//         return res
//           .status(400)
//           .json({ message: "Description, category, and priority are required." });
//       }

//       // Prepare media URLs from Cloudinary
//       const mediaFiles = req.files.map((file) => ({
//         url: file.path,
//         type: file.mimetype.includes("video") ? "video" : "image",
//       }));

//       // Create issue
//       const newIssue = new Issue({
//         user: req.user.id,
//         description,
//         category,
//         priority,
//         location: {
//           latitude,
//           longitude,
//           address,
//         },
//         media: mediaFiles,
//         status: "Pending",
//         timeline: [
//           {
//             status: "Submitted",
//             timestamp: new Date(),
//             note: "Citizen submitted the issue",
//           },
//         ],
//       });

//       await newIssue.save();

//       return res.status(201).json({
//         message: "Issue reported successfully!",
//         issue: newIssue,
//       });
//     } catch (err) {
//       console.error("Error creating issue:", err);
//       return res.status(500).json({ message: "Server error", error: err });
//     }
//   }
// );

// /**
//  * @route GET /api/issues/my
//  * @desc Get all issues created by the user
//  * @access Private
//  */
// router.get("/my", auth, async (req, res) => {
//   try {
//     const issues = await Issue.find({ user: req.user.id }).sort({
//       createdAt: -1,
//     });
//     res.json(issues);
//   } catch (err) {
//     console.error("Error fetching issues:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /**
//  * @route GET /api/issues/:id
//  * @desc Get a single issue by ID
//  * @access Private
//  */
// router.get("/:id", auth, async (req, res) => {
//   try {
//     const issue = await Issue.findById(req.params.id);

//     if (!issue)
//       return res.status(404).json({ message: "Issue not found" });

//     res.json(issue);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;

// const { CloudinaryStorage } = require('multer-storage-cloudinary');



const express = require("express");
const router = express.Router();
const multer = require("multer");
const streamifier = require("streamifier");

const Issue = require("../models/Issue");
const User = require("../models/User");
const auth = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const { transformIssueForWebPortal } = require("../utils/transformIssue");
const { sendMail } = require("../config/mailer");

const MAX_FILES = 5;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: MAX_FILES },
});

const isCloudinaryConfigured =
  Boolean(process.env.CLOUDINARY_CLOUD) &&
  Boolean(process.env.CLOUDINARY_KEY) &&
  Boolean(process.env.CLOUDINARY_SECRET);

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "civic_issues",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

router.post("/create", auth, upload.array("media", MAX_FILES), async (req, res) => {
  try {
    const { description, category, priority, latitude, longitude, address } =
      req.body;

    if (!description || !category || !priority) {
      return res
        .status(400)
        .json({ message: "Description, category, and priority are required." });
    }

    const mediaEntries = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (isCloudinaryConfigured) {
          const uploadResult = await uploadBufferToCloudinary(file);
          mediaEntries.push({
            url: uploadResult.secure_url,
            type: file.mimetype.includes("video") ? "video" : "image",
          });
        } else {
          console.warn(
            "Media upload skipped: Cloudinary credentials missing. Saving inline base64 instead."
          );
          mediaEntries.push({
            url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
            type: file.mimetype.includes("video") ? "video" : "image",
          });
        }
      }
    }

    const issue = new Issue({
      user: req.user.id,
      description,
      category,
      priority,
      location: {
        latitude,
        longitude,
        address,
      },
      media: mediaEntries,
      status: "Pending",
      timeline: [
        {
          status: "Submitted",
          timestamp: new Date(),
          note: "Citizen submitted the issue",
        },
      ],
    });

    await issue.save();

    try {
      const reporter = await User.findById(req.user.id).select("name email");
      if (reporter?.email) {
        await sendMail({
          to: reporter.email,
          subject: "Issue submitted successfully",
          html: `
            <p>Hi ${reporter.name || "there"},</p>
            <p>Your issue has been received with the following details:</p>
            <ul>
              <li><strong>Description:</strong> ${description}</li>
              <li><strong>Category:</strong> ${category}</li>
              <li><strong>Priority:</strong> ${priority}</li>
            </ul>
            <p>We will keep you posted as the status changes.</p>
            <p>Thanks for helping us improve the city.</p>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Issue submission email failed:", mailErr.message);
    }

    res.status(201).json({
      message: "Issue reported successfully!",
      issue,
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const issues = await Issue.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL ISSUES (for authorities/admin - no user filter)
router.get("/", auth, async (req, res) => {
  try {
    const { status, category, priority, city } = req.query;
    const filter = {};

    // Get user info to check if they're an authority
    const User = require("../models/User");
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    // If user is an authority, filter by their department
    if (currentUser.role === "authority") {
      if (currentUser.department) {
        // Match department to category (exact match, case-insensitive)
        filter.category = { $regex: new RegExp(`^${currentUser.department.trim()}$`, "i") };
        console.log(`[AUTHORITY FILTER] User: ${currentUser.name}, Department: "${currentUser.department}", Filter:`, JSON.stringify(filter));
      } else {
        // If authority has no department, they shouldn't see any issues
        console.log("[AUTHORITY FILTER] Authority has no department set, returning empty results");
        return res.json([]);
      }
    } else if (currentUser.role === "admin") {
      // Admins can see all issues, no filter needed
      console.log("[AUTHORITY FILTER] Admin user - showing all issues");
    } else {
      // Citizens should use /my endpoint, but if they hit this, return empty
      console.log("[AUTHORITY FILTER] Citizen user accessing /issues endpoint - returning empty");
      return res.json([]);
    }

    // Map web portal status to backend status
    const statusMap = {
      NEW: "Pending",
      ACKNOWLEDGED: "Acknowledged",
      IN_PROGRESS: "In Progress",
      RESOLVED: "Resolved",
    };

    if (status) {
      // Handle both web portal format and direct backend format
      const mappedStatus = statusMap[status] || status;
      filter.status = mappedStatus;
    }
    if (category && (currentUser?.role === "admin" || !currentUser?.role || currentUser?.role !== "authority")) {
      // Only allow category filter for admins or if not an authority
      // Map web portal categories to backend categories
      const categoryMap = {
        POTHOLES: "Roads",
        WATER: "Water",
        GARBAGE: "Sanitation",
        STREETLIGHTS: "Electricity",
        OTHER: "Other",
      };
      filter.category = categoryMap[category] || category;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (city && req.query.city) {
      filter["location.address"] = { $regex: city, $options: "i" };
    }

    console.log("Issue filter:", JSON.stringify(filter, null, 2));

    const issues = await Issue.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    console.log(`Found ${issues.length} issues matching filter`);

    // Transform issues for web portal if requested
    const transform = req.query.transform === "true" || req.headers["x-transform"] === "true";
    if (transform) {
      const transformed = issues.map(transformIssueForWebPortal);
      return res.json(transformed);
    }

    res.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET ANALYTICS
router.get("/analytics", auth, async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: "Pending" });
    const inProgressIssues = await Issue.countDocuments({
      status: "In Progress",
    });
    const resolvedIssues = await Issue.countDocuments({ status: "Resolved" });

    // Calculate average response time (time to first acknowledgment)
    const acknowledgedIssues = await Issue.find({
      status: { $in: ["Acknowledged", "In Progress", "Resolved"] },
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    acknowledgedIssues.forEach((issue) => {
      const submittedTime = new Date(issue.createdAt);
      const acknowledgedEntry = issue.timeline?.find(
        (t) => t.status === "Acknowledged"
      );
      if (acknowledgedEntry) {
        const responseTime =
          (new Date(acknowledgedEntry.timestamp) - submittedTime) / (1000 * 60 * 60); // hours
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    const avgResponseTime = responseCount > 0 ? (totalResponseTime / responseCount).toFixed(1) : 0;

    // Calculate average resolution time
    const resolvedIssuesList = await Issue.find({ status: "Resolved" });
    let totalResolutionTime = 0;
    let resolutionCount = 0;

    resolvedIssuesList.forEach((issue) => {
      const submittedTime = new Date(issue.createdAt);
      const resolvedEntry = issue.timeline?.find((t) => t.status === "Resolved");
      if (resolvedEntry) {
        const resolutionTime =
          (new Date(resolvedEntry.timestamp) - submittedTime) / (1000 * 60 * 60); // hours
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    });

    const avgResolutionTime = resolutionCount > 0 ? (totalResolutionTime / resolutionCount).toFixed(1) : 0;

    // Count SLA breaches (issues older than 48 hours and not resolved)
    const now = new Date();
    const slaBreachedIssues = await Issue.countDocuments({
      status: { $ne: "Resolved" },
      createdAt: { $lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
    });

    const issuesByCategory = await Issue.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const issuesByStatus = await Issue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      kpi: {
        totalIssues,
        resolvedIssues,
        avgResponseTime: `${avgResponseTime}h`,
        avgResolutionTime: `${avgResolutionTime}h`,
        openSLABreached: slaBreachedIssues,
      },
      total: totalIssues,
      byStatus: {
        pending: pendingIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
      },
      byCategory: issuesByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatusChart: issuesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE ISSUE STATUS (for authorities)
router.put("/:id/status", auth, async (req, res) => {
  try {
    let { status, assignedDepartment, assignedOfficerName, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Get current user (authority)
    const currentUser = await User.findById(req.user.id);

    // Map web portal status to backend status
    const statusMap = {
      NEW: "Pending",
      ACKNOWLEDGED: "Acknowledged",
      IN_PROGRESS: "In Progress",
      RESOLVED: "Resolved",
    };

    if (statusMap[status]) {
      status = statusMap[status];
    }

    const validStatuses = ["Pending", "Acknowledged", "In Progress", "Resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const issue = await Issue.findById(req.params.id).populate("user", "name email phone");
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // If authority is accepting/acknowledging the issue, assign it to them
    if (status === "Acknowledged" && currentUser?.role === "authority") {
      issue.assignedTo = {
        authority: currentUser._id,
        assignedAt: new Date(),
      };
      issue.assignedDepartment = currentUser.department || assignedDepartment;
      issue.assignedOfficerName = currentUser.name || assignedOfficerName;
    }

    issue.status = status;
    if (assignedDepartment && !issue.assignedDepartment) issue.assignedDepartment = assignedDepartment;
    if (assignedOfficerName && !issue.assignedOfficerName) issue.assignedOfficerName = assignedOfficerName;

    // Add to timeline with authority info
    const timelineNote = notes || 
      (status === "Acknowledged" ? `Issue accepted by ${currentUser?.name || 'authority'}` : 
       `Status updated to ${status}${currentUser?.name ? ` by ${currentUser.name}` : ''}`);

    issue.timeline.push({
      status,
      timestamp: new Date(),
      note: timelineNote,
    });

    await issue.save();

    try {
      const recipients = [];
      if (issue.user?.email) {
        recipients.push(issue.user.email);
      }
      if (currentUser?.email) {
        recipients.push(currentUser.email);
      }

      if (recipients.length) {
        await sendMail({
          to: recipients,
          subject: `Issue status updated to ${status}`,
          html: `
            <p>Hello,</p>
            <p>The issue <strong>${issue.description?.slice(0, 80) || issue._id}</strong> has been updated.</p>
            <ul>
              <li><strong>Status:</strong> ${status}</li>
              <li><strong>Department:</strong> ${issue.assignedDepartment || currentUser?.department || "N/A"}</li>
              <li><strong>Notes:</strong> ${timelineNote}</li>
            </ul>
            <p>You will continue to receive notifications for future updates.</p>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Status update email failed:", mailErr.message);
    }

    // Transform for web portal if requested
    const transform = req.query.transform === "true" || req.headers["x-transform"] === "true";
    const responseIssue = transform ? transformIssueForWebPortal(issue) : issue;

    res.json({
      message: "Issue status updated successfully",
      issue: responseIssue,
    });
  } catch (error) {
    console.error("Error updating issue status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    // Allow access if user owns the issue OR if they're an authority/admin
    const issue = await Issue.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("assignedTo.authority", "name email department");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check access: user can see their own issues, authorities can see issues in their department
    const currentUser = await User.findById(req.user.id);
    
    // If user is citizen, only allow if they own the issue
    if (currentUser.role === "citizen" && issue.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // If user is authority, only allow if issue matches their department
    if (currentUser.role === "authority" && currentUser.department !== issue.category) {
      return res.status(403).json({ message: "This issue is not in your department" });
    }

    // Transform issue for web portal if requested
    const transform = req.query.transform === "true" || req.headers["x-transform"] === "true";
    if (transform) {
      return res.json(transformIssueForWebPortal(issue));
    }

    res.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
