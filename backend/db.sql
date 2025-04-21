-- CREATE TABLES

CREATE TABLE users (
    uid text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL,
    avatar_url text,
    created_at text NOT NULL,
    updated_at text NOT NULL
);

CREATE TABLE projects (
    uid text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    due_date text NOT NULL,
    priority text NOT NULL,
    status text NOT NULL,
    milestones json,
    created_by text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(uid)
);

CREATE TABLE tasks (
    uid text PRIMARY KEY,
    project_uid text NOT NULL,
    parent_task_uid text,
    title text NOT NULL,
    description text NOT NULL,
    due_date text NOT NULL,
    priority text NOT NULL,
    status text NOT NULL,
    recurrence json,
    created_by text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (project_uid) REFERENCES projects(uid),
    FOREIGN KEY (parent_task_uid) REFERENCES tasks(uid),
    FOREIGN KEY (created_by) REFERENCES users(uid)
);

CREATE TABLE task_assignments (
    uid text PRIMARY KEY,
    task_uid text NOT NULL,
    user_uid text NOT NULL,
    FOREIGN KEY (task_uid) REFERENCES tasks(uid),
    FOREIGN KEY (user_uid) REFERENCES users(uid)
);

CREATE TABLE comments (
    uid text PRIMARY KEY,
    task_uid text NOT NULL,
    user_uid text NOT NULL,
    content text NOT NULL,
    created_at text NOT NULL,
    mentions json,
    FOREIGN KEY (task_uid) REFERENCES tasks(uid),
    FOREIGN KEY (user_uid) REFERENCES users(uid)
);

CREATE TABLE attachments (
    uid text PRIMARY KEY,
    task_uid text NOT NULL,
    uploaded_by text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    uploaded_at text NOT NULL,
    FOREIGN KEY (task_uid) REFERENCES tasks(uid),
    FOREIGN KEY (uploaded_by) REFERENCES users(uid)
);

CREATE TABLE project_members (
    uid text PRIMARY KEY,
    project_uid text NOT NULL,
    user_uid text NOT NULL,
    role_in_project text NOT NULL,
    FOREIGN KEY (project_uid) REFERENCES projects(uid),
    FOREIGN KEY (user_uid) REFERENCES users(uid)
);

CREATE TABLE teams (
    uid text PRIMARY KEY,
    team_name text NOT NULL,
    created_by text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(uid)
);

CREATE TABLE team_memberships (
    uid text PRIMARY KEY,
    team_uid text NOT NULL,
    user_uid text NOT NULL,
    role_in_team text NOT NULL,
    FOREIGN KEY (team_uid) REFERENCES teams(uid),
    FOREIGN KEY (user_uid) REFERENCES users(uid)
);

CREATE TABLE notifications (
    uid text PRIMARY KEY,
    user_uid text NOT NULL,
    notification_type text NOT NULL,
    content text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at text NOT NULL,
    FOREIGN KEY (user_uid) REFERENCES users(uid)
);

CREATE TABLE activity_feed (
    uid text PRIMARY KEY,
    project_uid text,
    task_uid text,
    user_uid text NOT NULL,
    action text NOT NULL,
    details json,
    created_at text NOT NULL,
    FOREIGN KEY (project_uid) REFERENCES projects(uid),
    FOREIGN KEY (task_uid) REFERENCES tasks(uid),
    FOREIGN KEY (user_uid) REFERENCES users(uid)
);


-- SEED DATA

-- Users
INSERT INTO users (uid, name, email, password_hash, role, avatar_url, created_at, updated_at)
VALUES
('user1', 'Alice Johnson', 'alice@example.com', 'hash1', 'admin', 'https://picsum.photos/seed/alice/200', '2023-01-01T10:00:00Z', '2023-01-01T10:00:00Z'),
('user2', 'Bob Smith', 'bob@example.com', 'hash2', 'manager', 'https://picsum.photos/seed/bob/200', '2023-01-02T11:00:00Z', '2023-01-02T11:00:00Z'),
('user3', 'Charlie Brown', 'charlie@example.com', 'hash3', 'member', 'https://picsum.photos/seed/charlie/200', '2023-01-03T12:00:00Z', '2023-01-03T12:00:00Z');

-- Projects
INSERT INTO projects (uid, title, description, due_date, priority, status, milestones, created_by, created_at, updated_at)
VALUES
('project1', 'Website Redesign', 'Revamp the corporate website for better user experience.', '2023-03-01', 'high', 'active', '[{"milestone": "Design Complete", "completed": false}]', 'user2', '2023-02-01T09:00:00Z', '2023-02-01T09:00:00Z'),
('project2', 'Mobile App Launch', 'Develop and launch the new mobile application.', '2023-04-15', 'medium', 'active', '[{"milestone": "Prototype", "completed": true}, {"milestone": "Beta", "completed": false}]', 'user2', '2023-02-05T10:30:00Z', '2023-02-05T10:30:00Z');

-- Tasks
INSERT INTO tasks (uid, project_uid, parent_task_uid, title, description, due_date, priority, status, recurrence, created_by, created_at, updated_at)
VALUES
('task1', 'project1', null, 'Design Mockups', 'Create design mockups for the new website layout.', '2023-02-20', 'high', 'in_progress', null, 'user2', '2023-02-02T10:00:00Z', '2023-02-10T12:00:00Z'),
('task2', 'project1', null, 'Content Update', 'Revise and update website content.', '2023-02-25', 'medium', 'to_do', null, 'user2', '2023-02-03T11:00:00Z', '2023-02-03T11:00:00Z'),
('task3', 'project1', 'task1', 'Logo Design', 'Design a new logo variant for the website.', '2023-02-22', 'medium', 'to_do', null, 'user2', '2023-02-04T12:00:00Z', '2023-02-04T12:00:00Z'),
('task4', 'project2', null, 'Prototype Development', 'Develop a working prototype of the mobile app.', '2023-03-15', 'high', 'in_progress', '{"type": "weekly", "interval": 1}', 'user2', '2023-02-06T09:00:00Z', '2023-02-08T10:00:00Z'),
('task5', 'project2', null, 'User Testing', 'Conduct user testing and gather feedback for the app.', '2023-03-20', 'medium', 'to_do', '{"type": "once"}', 'user3', '2023-02-07T09:30:00Z', '2023-02-07T09:30:00Z');

-- Task Assignments
INSERT INTO task_assignments (uid, task_uid, user_uid)
VALUES
('assign1', 'task1', 'user2'),
('assign2', 'task2', 'user3'),
('assign3', 'task3', 'user2'),
('assign4', 'task4', 'user2'),
('assign5', 'task5', 'user3');

-- Comments
INSERT INTO comments (uid, task_uid, user_uid, content, created_at, mentions)
VALUES
('comment1', 'task1', 'user3', 'Looking good! We might need to adjust the color scheme.', '2023-02-11T08:00:00Z', '["user2"]'),
('comment2', 'task2', 'user1', 'Please review the updated content.', '2023-02-12T09:00:00Z', null),
('comment3', 'task4', 'user2', 'Prototype is ready for testing.', '2023-02-09T11:00:00Z', '["user3"]');

-- Attachments
INSERT INTO attachments (uid, task_uid, uploaded_by, file_name, file_url, uploaded_at)
VALUES
('attach1', 'task1', 'user2', 'mockup.png', 'https://picsum.photos/seed/mockup/200', '2023-02-11T10:00:00Z'),
('attach2', 'task4', 'user2', 'prototype.zip', 'https://picsum.photos/seed/prototype/200', '2023-02-09T12:00:00Z');

-- Project Members
INSERT INTO project_members (uid, project_uid, user_uid, role_in_project)
VALUES
('pm1', 'project1', 'user2', 'manager'),
('pm2', 'project1', 'user3', 'member'),
('pm3', 'project2', 'user2', 'manager'),
('pm4', 'project2', 'user3', 'member');

-- Teams
INSERT INTO teams (uid, team_name, created_by, created_at, updated_at)
VALUES
('team1', 'Design Team', 'user2', '2023-02-01T08:00:00Z', '2023-02-01T08:00:00Z'),
('team2', 'Development Team', 'user2', '2023-02-02T08:30:00Z', '2023-02-02T08:30:00Z');

-- Team Memberships
INSERT INTO team_memberships (uid, team_uid, user_uid, role_in_team)
VALUES
('tm1', 'team1', 'user2', 'admin'),
('tm2', 'team1', 'user3', 'member'),
('tm3', 'team2', 'user2', 'admin'),
('tm4', 'team2', 'user1', 'member');

-- Notifications
INSERT INTO notifications (uid, user_uid, notification_type, content, is_read, created_at)
VALUES
('notif1', 'user1', 'task_update', 'Task task1 has been updated.', false, '2023-02-10T10:00:00Z'),
('notif2', 'user3', 'comment', 'New comment on task task1.', false, '2023-02-11T08:05:00Z'),
('notif3', 'user2', 'reminder', 'Daily standup meeting in 30 minutes.', false, '2023-02-12T07:30:00Z');

-- Activity Feed
INSERT INTO activity_feed (uid, project_uid, task_uid, user_uid, action, details, created_at)
VALUES
('act1', 'project1', 'task1', 'user2', 'updated_status', '{"from": "to_do", "to": "in_progress"}', '2023-02-10T12:00:00Z'),
('act2', 'project1', 'task2', 'user1', 'added_comment', '{"comment_uid": "comment2"}', '2023-02-12T09:00:00Z'),
('act3', 'project2', 'task4', 'user2', 'uploaded_attachment', '{"attachment_uid": "attach2"}', '2023-02-09T12:00:00Z');