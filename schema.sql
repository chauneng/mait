-- The table order was sorted considering the relationship to prevent error from occurring if all are run at once.

-- users Table Create SQL
CREATE TABLE users
(
    `id`           INT            NOT NULL    AUTO_INCREMENT, 
    `username`     VARCHAR(16)    NOT NULL, 
    `password`     char(128)      NOT NULL, 
    `created_at`   DATETIME       NOT NULL, 
    `nickname`     VARCHAR(16)    NOT NULL, 
    `social_type`  INT            NULL, 
     PRIMARY KEY (id)
);


-- subjects Table Create SQL
CREATE TABLE subjects
(
    `id`       INT            NOT NULL    AUTO_INCREMENT, 
    `user_id`  VARCHAR(45)    NOT NULL, 
    `name`     VARCHAR(45)    NOT NULL, 
     PRIMARY KEY (id)
);

ALTER TABLE subjects
    ADD CONSTRAINT FK_subjects_user_id_users_id FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT;


-- d_days Table Create SQL
CREATE TABLE d_days
(
    `id`       INT            NOT NULL    AUTO_INCREMENT, 
    `user_id`  INT            NULL, 
    `date`     DATE           NULL, 
    `content`  varchar(45)    NULL, 
     PRIMARY KEY (id)
);

ALTER TABLE d_days
    ADD CONSTRAINT FK_d_days_user_id_users_id FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT;


-- daily_study_summaries Table Create SQL
CREATE TABLE daily_study_summaries
(
    `id`          INT         NOT NULL    AUTO_INCREMENT, 
    `subject_id`  INT         NULL, 
    `duration`    DATETIME    NULL, 
    `date`        DATE        NULL, 
     PRIMARY KEY (id)
);

ALTER TABLE daily_study_summaries
    ADD CONSTRAINT FK_daily_study_summaries_subject_id_subjects_id FOREIGN KEY (subject_id)
        REFERENCES subjects (id) ON DELETE RESTRICT ON UPDATE RESTRICT;


-- todos Table Create SQL
CREATE TABLE todos
(
    `id`          INT            NOT NULL    AUTO_INCREMENT, 
    `user_id`     INT            NOT NULL, 
    `content`     VARCHAR(45)    NOT NULL, 
    `subject_id`  INT            NULL, 
    `is_done`     TINYINT        NULL        DEFAULT 0 COMMENT 'undone', 
     PRIMARY KEY (id)
);

ALTER TABLE todos
    ADD CONSTRAINT FK_todos_subject_id_subjects_id FOREIGN KEY (subject_id)
        REFERENCES subjects (id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE todos
    ADD CONSTRAINT FK_todos_user_id_users_id FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT;


-- social_types Table Create SQL
CREATE TABLE social_types
(
    `id`    INT            NOT NULL    AUTO_INCREMENT, 
    `name`  VARCHAR(45)    NOT NULL, 
     PRIMARY KEY (id)
);

ALTER TABLE social_types
    ADD CONSTRAINT FK_social_types_id_users_social_type FOREIGN KEY (id)
        REFERENCES users (social_type) ON DELETE RESTRICT ON UPDATE RESTRICT;


-- study_durations Table Create SQL
CREATE TABLE study_durations
(
    `id`          INT            NOT NULL    AUTO_INCREMENT, 
    `subject`     VARCHAR(45)    NULL, 
    `user_id`     INT            NULL, 
    `start_time`  DATETIME       NULL, 
    `end_time`    DATETIME       NOT NULL, 
    `created_at`  DATE           NULL, 
     PRIMARY KEY (id)
);

CREATE INDEX IX_study_durations_1
    ON study_durations(user_id);

ALTER TABLE study_durations
    ADD CONSTRAINT FK_study_durations_user_id_users_id FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT;