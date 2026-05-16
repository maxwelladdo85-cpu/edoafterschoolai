-- Performance indexes on hot foreign-key and time columns.
-- All are CREATE INDEX IF NOT EXISTS so the migration is safe to re-run.

-- Lesson activity (queried per learner and per lesson constantly)
CREATE INDEX IF NOT EXISTS idx_lesson_views_learner_id ON public.lesson_views (learner_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_lesson_id ON public.lesson_views (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_views_viewed_at ON public.lesson_views (viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_learner_id ON public.lesson_completions (learner_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON public.lesson_completions (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_completed_at ON public.lesson_completions (completed_at DESC);

-- Enrollments (My Courses, teacher dashboards, completion calcs)
CREATE INDEX IF NOT EXISTS idx_enrollments_learner_id ON public.enrollments (learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON public.enrollments (enrolled_at DESC);

-- Quizzes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_learner_id ON public.quiz_attempts (learner_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_question_choices_question_id ON public.question_choices (question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON public.attempt_answers (attempt_id);

-- Course content
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons (module_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses (teacher_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes (course_id);

-- Community
CREATE INDEX IF NOT EXISTS idx_forum_posts_course_id ON public.forum_posts (course_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent_id ON public.forum_posts (parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON public.forum_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON public.forum_posts (created_at DESC);

-- Direct messages (inbox queries hit these constantly)
CREATE INDEX IF NOT EXISTS idx_dm_sender_id ON public.direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_recipient_id ON public.direct_messages (recipient_id);
CREATE INDEX IF NOT EXISTS idx_dm_pair_created ON public.direct_messages (sender_id, recipient_id, created_at DESC);

-- Notifications (bell polls this on every page)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC);

-- Roles (has_role() is called inside almost every RLS policy)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles (user_id, role);

-- Virtual classes
CREATE INDEX IF NOT EXISTS idx_virtual_classes_course_id ON public.virtual_classes (course_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_teacher_id ON public.virtual_classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_vca_class_id ON public.virtual_class_attendance (class_id);
CREATE INDEX IF NOT EXISTS idx_vca_learner_id ON public.virtual_class_attendance (learner_id);

-- Gamification
CREATE INDEX IF NOT EXISTS idx_badges_learner_id ON public.badges (learner_id);
CREATE INDEX IF NOT EXISTS idx_certificates_learner_id ON public.certificates (learner_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates (course_id);

-- Tutor messages
CREATE INDEX IF NOT EXISTS idx_tutor_messages_learner_course ON public.tutor_messages (learner_id, course_id, created_at);

-- Profiles (search + class roster lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_class_level ON public.profiles (class_level);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);