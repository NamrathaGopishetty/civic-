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
const { sendPushAsync } = require("../utils/push");

const emitIssueEvent = (io, userId, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit("issue-update", payload);
};

const MAX_FILES = 5;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: MAX_FILES },
});

// Handle multer errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: `Maximum ${MAX_FILES} files allowed.` });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(500).json({ message: `Upload failed: ${err.message}` });
  }
  next();
};

const uploadToCloudinary = (file) =>
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

router.post("/create", auth, upload.array("media", MAX_FILES), handleUploadErrors, async (req, res) => {
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
        const result = await uploadToCloudinary(file);
        mediaEntries.push({
          url: result.secure_url,
          type: file.mimetype.includes("video") ? "video" : "image",
        });
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
      const reporter = await User.findById(req.user.id).select(
        "name email expoPushToken"
      );
      if (reporter?.email) {
        await sendMail({
          to: reporter.email,
          subject: "Issue submitted successfully - Civic Connect",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0D47A1; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin:0;">🏛️ Civic Connect</h2>
              </div>
              <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                <p>Hi ${reporter.name || "there"},</p>
                <p>Your issue has been received with the following details:</p>
                <table style="width:100%; border-collapse: collapse;">
                  <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Description</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${description}</td></tr>
                  <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Category</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${category}</td></tr>
                  <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Priority</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${priority}</td></tr>
                  <tr><td style="padding:8px;"><strong>Status</strong></td><td style="padding:8px;">Pending</td></tr>
                </table>
                <p style="margin-top:20px;">We will keep you posted as the status changes.</p>
                <p>Thanks for helping us improve the city.</p>
                <p style="color:#888; font-size:12px; margin-top:20px;">— The Civic Connect Team</p>
              </div>
            </div>
          `,
        });
      }

      // Find authorities for this category and notify them
      const authorities = await User.find({ role: "authority", department: category }).select("name email");
      if (authorities.length > 0) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
        const acceptUrl = `${baseUrl}/api/issues/${issue._id}/accept`;

        for (const authority of authorities) {
          if (authority.email) {
            await sendMail({
              to: authority.email,
              subject: `New ${category} Issue Requires Attention - Civic Connect`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #0D47A1; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin:0;">🏛️ Civic Connect</h2>
                    <p style="margin:5px 0 0 0; opacity:0.9;">New Issue Assignment</p>
                  </div>
                  <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                    <p>Hello ${authority.name || "Officer"},</p>
                    <p>A new <strong>${category}</strong> issue has been reported and requires your attention.</p>
                    <table style="width:100%; border-collapse: collapse;">
                      <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Description</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${description}</td></tr>
                      <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Priority</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${priority}</td></tr>
                      <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Location</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${issue.location?.address || 'Not provided'}</td></tr>
                      <tr><td style="padding:8px;"><strong>Reported by</strong></td><td style="padding:8px;">${reporter?.name || 'Anonymous'}</td></tr>
                    </table>
                    <div style="text-align:center; margin: 24px 0;">
                      <a href="${acceptUrl}" style="display:inline-block; background:#2E7D32; color:#fff; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
                        ✅ Accept Issue
                      </a>
                    </div>
                    <p style="font-size:13px; color:#666;">Clicking "Accept Issue" will acknowledge this issue and assign it to you. The citizen and portal will be notified automatically.</p>
                    <p style="color:#888; font-size:12px; margin-top:20px;">— The Civic Connect Team</p>
                  </div>
                </div>
              `,
            });
          }
        }
      }

      if (reporter?.expoPushToken) {
        await sendPushAsync({
          to: reporter.expoPushToken,
          title: "Issue submitted",
          body: "Your issue has been submitted successfully.",
          data: {
            issueId: issue._id.toString(),
            status: issue.status,
          },
        });
      }

      emitIssueEvent(req.io, req.user.id, {
        type: "issueCreated",
        issueId: issue._id.toString(),
        status: issue.status,
        title: "Issue submitted",
        message: "Your issue has been submitted successfully.",
        issue,
      });
    } catch (notifyErr) {
      console.warn("Issue submission notification failed:", notifyErr.message);
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

    // Calculate average rating
    const ratedIssues = await Issue.find({ 'rating.score': { $exists: true, $ne: null } });
    let totalRating = 0;
    let ratingCount = 0;
    ratedIssues.forEach((issue) => {
      if (issue.rating && issue.rating.score) {
        totalRating += issue.rating.score;
        ratingCount++;
      }
    });
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 'N/A';
    const totalRated = ratingCount;

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
        avgRating: avgRating,
        totalRated: totalRated,
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
      const pushTokens = [];

      if (issue.user?.email) {
        recipients.push(issue.user.email);
      }
      if (currentUser?.email) {
        recipients.push(currentUser.email);
      }

      // Load full reporter user to get push token
      const reporter = await User.findById(issue.user?._id).select(
        "expoPushToken"
      );
      if (reporter?.expoPushToken) {
        pushTokens.push(reporter.expoPushToken);
      }

      // Optionally notify authority on mobile if they ever use the app
      const authority =
        currentUser?.role === "authority"
          ? await User.findById(currentUser._id).select("expoPushToken")
          : null;
      if (authority?.expoPushToken) {
        pushTokens.push(authority.expoPushToken);
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
              <li><strong>Department:</strong> ${
                issue.assignedDepartment || currentUser?.department || "N/A"
              }</li>
              <li><strong>Notes:</strong> ${timelineNote}</li>
            </ul>
            <p>You will continue to receive notifications for future updates.</p>
          `,
        });
      }

      if (pushTokens.length) {
        await sendPushAsync({
          to: pushTokens,
          title: "Issue status updated",
          body: `Status changed to ${status}`,
          data: {
            issueId: issue._id.toString(),
            status,
          },
        });
      }

      const reporterId =
        issue.user?._id?.toString() ||
        (typeof issue.user === "string" ? issue.user : null);
      if (reporterId) {
        emitIssueEvent(req.io, reporterId, {
          type: "issueStatusUpdated",
          issueId: issue._id.toString(),
          status,
          title: "Issue status updated",
          message: `Status changed to ${status}`,
          notes: timelineNote,
          issue,
        });
      }

      if (currentUser?._id) {
        emitIssueEvent(req.io, currentUser._id.toString(), {
          type: "issueStatusUpdated",
          issueId: issue._id.toString(),
          status,
          title: "Issue status updated",
          message: `Status changed to ${status}`,
          notes: timelineNote,
          issue,
        });
      }
    } catch (notifyErr) {
      console.warn(
        "Status update email / push notification failed:",
        notifyErr.message
      );
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

/**
 * @route POST /api/issues/:id/rate
 * @desc Rate a resolved issue
 * @access Private (citizen who reported the issue)
 */
router.post("/:id/rate", auth, async (req, res) => {
  try {
    const { score, review } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the reporter can rate this issue" });
    }

    if (issue.status !== "Resolved") {
      return res.status(400).json({ message: "Can only rate resolved issues" });
    }

    if (issue.rating && issue.rating.score) {
      return res.status(400).json({ message: "This issue has already been rated" });
    }

    issue.rating = {
      score: Number(score),
      review: review || "",
      ratedAt: new Date(),
    };

    issue.timeline.push({
      status: issue.status,
      timestamp: new Date(),
      note: `Citizen rated this issue ${score}/5${review ? ': ' + review : ''}`,
    });

    await issue.save();

    res.json({ message: "Rating submitted successfully", rating: issue.rating });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route GET /api/issues/:id/accept
 * @desc Accept an issue from email link (no auth required)
 * @access Public
 */
router.get("/:id/accept", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("user", "name email");
    if (!issue) {
      return res.status(404).send(`
        <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;">
          <h2>Issue Not Found</h2><p>This issue may have been removed.</p>
        </body></html>
      `);
    }

    if (issue.status !== "Pending") {
      return res.send(`
        <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;">
          <div style="max-width:500px;margin:0 auto;">
            <h2 style="color:#0D47A1;">🏛️ Civic Connect</h2>
            <div style="background:#E8F5E9;padding:20px;border-radius:8px;margin-top:20px;">
              <h3 style="color:#2E7D32;">✅ Issue Already ${issue.status}</h3>
              <p>This issue has already been ${issue.status.toLowerCase()}.</p>
              <p style="color:#666;font-size:13px;margin-top:16px;">Status: <strong>${issue.status}</strong></p>
            </div>
          </div>
        </body></html>
      `);
    }

    const issueId = issue._id.toString();

    // Find the authority who should accept (from query or first matching authority)
    const authorityName = req.query.officer || "Authority";
    const authorityDept = issue.category;

    // Update issue status
    issue.status = "Acknowledged";
    issue.assignedDepartment = authorityDept;
    issue.assignedOfficerName = authorityName;
    issue.timeline.push({
      status: "Acknowledged",
      timestamp: new Date(),
      note: `Issue accepted via email by ${authorityName}`,
    });
    await issue.save();

    // Notify the reporter
    try {
      const reporter = issue.user;
      if (reporter?.email) {
        await sendMail({
          to: reporter.email,
          subject: `Issue Accepted - ${issue.category} - Civic Connect`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#0D47A1;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;">🏛️ Civic Connect</h2>
              </div>
              <div style="padding:20px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
                <p>Hi ${reporter.name || "there"},</p>
                <p>Great news! Your <strong>${issue.category}</strong> issue has been <strong style="color:#2E7D32;">accepted</strong> by the ${authorityDept} department.</p>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Status</strong></td><td style="padding:8px;border-bottom:1px solid #eee;color:#0277BD;font-weight:bold;">Acknowledged</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Assigned Officer</strong></td><td style="padding:8px;border-bottom:1px solid #eee;">${authorityName}</td></tr>
                  <tr><td style="padding:8px;"><strong>Department</strong></td><td style="padding:8px;">${authorityDept}</td></tr>
                </table>
                <p style="margin-top:20px;">You will receive further updates as the work progresses.</p>
                <p style="color:#888;font-size:12px;margin-top:20px;">— The Civic Connect Team</p>
              </div>
            </div>
          `,
        });
      }

      if (reporter?.expoPushToken) {
        await sendPushAsync({
          to: reporter.expoPushToken,
          title: "Issue Accepted",
          body: `Your ${issue.category} issue has been accepted by ${authorityName}`,
          data: { issueId, status: "Acknowledged" },
        });
      }
    } catch (notifyErr) {
      console.warn("Accept notification failed:", notifyErr.message);
    }

    // Emit realtime event
    try {
      const reporterId = issue.user?._id?.toString() || (typeof issue.user === "string" ? issue.user : null);
      if (reporterId) {
        emitIssueEvent(req.io, reporterId, {
          type: "issueStatusUpdated",
          issueId,
          status: "Acknowledged",
          title: "Issue Accepted",
          message: `Your ${issue.category} issue has been accepted`,
          issue,
        });
      }
    } catch (rtErr) {
      console.warn("Realtime emit after accept failed:", rtErr.message);
    }

    res.send(`
      <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;">
        <div style="max-width:500px;margin:0 auto;">
          <h2 style="color:#0D47A1;">🏛️ Civic Connect</h2>
          <div style="background:#E8F5E9;padding:24px;border-radius:8px;margin-top:20px;">
            <h3 style="color:#2E7D32;">✅ Issue Accepted Successfully</h3>
            <p>The issue has been acknowledged and assigned to you.</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;text-align:left;">
              <tr><td style="padding:6px;"><strong>Category:</strong></td><td style="padding:6px;">${issue.category}</td></tr>
              <tr><td style="padding:6px;"><strong>Priority:</strong></td><td style="padding:6px;">${issue.priority}</td></tr>
              <tr><td style="padding:6px;"><strong>Status:</strong></td><td style="padding:6px;color:#0277BD;font-weight:bold;">Acknowledged</td></tr>
            </table>
          </div>
          <p style="margin-top:24px;color:#666;">The citizen has been notified. Log in to the <a href="/portal/" style="color:#0D47A1;">authority portal</a> to manage this issue.</p>
        </div>
      </body></html>
    `);
  } catch (error) {
    console.error("Error accepting issue via email:", error);
    res.status(500).send(`
      <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;">
        <h2>Something went wrong</h2><p>Please try again or contact support.</p>
      </body></html>
    `);
  }
});

module.exports = router;
