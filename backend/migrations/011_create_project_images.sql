-- ============================================================
-- ProjectForge
-- Project Showcase Images
-- Maximum five images per project is enforced by the API.
-- ============================================================

BEGIN;


CREATE TABLE project_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL,

    uploaded_by_user_id UUID NOT NULL,

    file_name VARCHAR(255) NOT NULL UNIQUE,

    original_name VARCHAR(255) NOT NULL,

    mime_type VARCHAR(50) NOT NULL,

    file_size_bytes INTEGER NOT NULL,

    display_order SMALLINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_images_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_images_uploader
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_project_images_order
        UNIQUE (project_id, display_order),

    CONSTRAINT chk_project_images_mime
        CHECK (
            mime_type IN (
                'image/jpeg',
                'image/png',
                'image/webp'
            )
        ),

    CONSTRAINT chk_project_images_size
        CHECK (
            file_size_bytes > 0
            AND file_size_bytes <= 5242880
        ),

    CONSTRAINT chk_project_images_order
        CHECK (
            display_order >= 1
            AND display_order <= 5
        )
);


CREATE INDEX idx_project_images_project
    ON project_images(project_id);


CREATE INDEX idx_project_images_created_at
    ON project_images(created_at);


COMMIT;