
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
            minlength: [2, "Task title must be at least 2 characters"],
            maxlength: [150, "Task title cannot exceed 150 characters"],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
            default: "",
        },

        status: {
            type: String,
            enum: ["todo", "in-progress", "completed"],
            default: "todo",
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        dueDate: {
            type: Date,
            default: null,
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

taskSchema.index({ owner: 1, project: 1, createdAt: -1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;