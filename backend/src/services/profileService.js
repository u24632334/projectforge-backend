const {
  pool
} = require(
  "../config/db"
);


const VALID_PROFICIENCIES = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED"
];


const MAX_DISPLAY_NAME_LENGTH =
  120;

const MAX_BIO_LENGTH =
  1000;

const MAX_INTERESTS_LENGTH =
  1000;

const MAX_SKILL_NAME_LENGTH =
  120;

const MAX_SKILL_CATEGORY_LENGTH =
  120;


async function getProfileByUserId(
  userId
) {
  const profileResult =
    await pool.query(
      `
        SELECT
          p.profile_id,
          p.user_id,
          u.email,
          u.system_role,
          p.display_name,
          p.bio,
          p.interests,
          p.availability_hours_per_week
        FROM profiles p
        JOIN users u
          ON u.user_id = p.user_id
        WHERE p.user_id = $1
      `,
      [
        userId
      ]
    );


  if (
    profileResult.rows.length ===
    0
  ) {
    return null;
  }


  const skillsResult =
    await pool.query(
      `
        SELECT
          s.skill_id,
          s.name,
          s.category,
          us.proficiency
        FROM user_skills us
        JOIN skills s
          ON s.skill_id =
             us.skill_id
        WHERE us.user_id = $1
        ORDER BY
          s.name ASC
      `,
      [
        userId
      ]
    );


  const completedProjectsResult =
    await pool.query(
      `
        SELECT DISTINCT
          p.project_id,
          p.title,
          p.description,
          p.category,
          p.repository_url,
          ss.approved_at
        FROM project_memberships pm
        JOIN projects p
          ON p.project_id =
             pm.project_id
        JOIN showcase_submissions ss
          ON ss.project_id =
             p.project_id
        WHERE
          pm.user_id = $1
          AND p.status =
              'COMPLETED'
          AND ss.status =
              'APPROVED'
        ORDER BY
          ss.approved_at DESC,
          p.title ASC
      `,
      [
        userId
      ]
    );


  return {
    ...profileResult.rows[0],

    skills:
      skillsResult.rows,

    approved_completed_projects:
      completedProjectsResult.rows
  };
}


async function updateMyProfile(
  userId,
  profileData
) {
  const {
    displayName,
    bio = "",
    interests = [],
    availabilityHoursPerWeek,
    skills
  } = profileData || {};


  if (
    !displayName ||
    typeof displayName !==
      "string" ||
    !displayName.trim()
  ) {
    throw new Error(
      "Display name cannot be blank."
    );
  }


  const cleanDisplayName =
    displayName.trim();


  if (
    cleanDisplayName.length >
    MAX_DISPLAY_NAME_LENGTH
  ) {
    throw new Error(
      `Maximum characters exceeded. Display name may not exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`
    );
  }


  const cleanBio =
    typeof bio ===
      "string"
      ? bio
      : "";


  if (
    cleanBio.length >
    MAX_BIO_LENGTH
  ) {
    throw new Error(
      `Maximum characters exceeded. Bio may not exceed ${MAX_BIO_LENGTH} characters.`
    );
  }


  const hours =
    Number(
      availabilityHoursPerWeek
    );


  if (
    !Number.isFinite(
      hours
    ) ||
    hours < 0 ||
    hours > 168
  ) {
    throw new Error(
      "Availability hours must be between 0 and 168."
    );
  }


  if (
    !Number.isInteger(
      hours
    )
  ) {
    throw new Error(
      "Availability hours must be a whole number."
    );
  }


  if (
    skills !== undefined &&
    !Array.isArray(
      skills
    )
  ) {
    throw new Error(
      "Skills must be provided as a list."
    );
  }


  let cleanedSkills = null;


  if (
    Array.isArray(
      skills
    )
  ) {
    cleanedSkills =
      skills.map(
        (skill) => {
          const name =
            typeof skill?.name ===
              "string"
              ? skill.name.trim()
              : "";


          const category =
            typeof skill?.category ===
              "string"
              ? skill.category.trim()
              : "";


          const proficiency =
            String(
              skill?.proficiency ||
              ""
            )
              .trim()
              .toUpperCase();


          if (
            !name ||
            !category
          ) {
            throw new Error(
              "Every skill must have a name and category."
            );
          }


          if (
            name.length >
            MAX_SKILL_NAME_LENGTH
          ) {
            throw new Error(
              `Maximum characters exceeded. Skill name may not exceed ${MAX_SKILL_NAME_LENGTH} characters.`
            );
          }


          if (
            category.length >
            MAX_SKILL_CATEGORY_LENGTH
          ) {
            throw new Error(
              `Maximum characters exceeded. Skill category may not exceed ${MAX_SKILL_CATEGORY_LENGTH} characters.`
            );
          }


          if (
            !VALID_PROFICIENCIES
              .includes(
                proficiency
              )
          ) {
            throw new Error(
              "Skill proficiency must be BEGINNER, INTERMEDIATE or ADVANCED."
            );
          }


          return {
            name,
            category,
            proficiency
          };
        }
      );


    const seenSkillNames =
      new Set();


    for (
      const skill of cleanedSkills
    ) {
      const key =
        skill.name
          .toLowerCase();


      if (
        seenSkillNames.has(
          key
        )
      ) {
        throw new Error(
          "Each skill can only be added once."
        );
      }


      seenSkillNames.add(
        key
      );
    }
  }


  const cleanInterests =
    Array.isArray(
      interests
    )
      ? interests
          .map(
            (item) =>
              String(
                item
              ).trim()
          )
          .filter(
            (item) =>
              item.length >
              0
          )
      : [];


  const interestsText =
    cleanInterests.join(
      ", "
    );


  if (
    interestsText.length >
    MAX_INTERESTS_LENGTH
  ) {
    throw new Error(
      `Maximum characters exceeded. Interests may not exceed ${MAX_INTERESTS_LENGTH} characters in total.`
    );
  }


  const result =
    await pool.query(
      `
        INSERT INTO profiles (
          user_id,
          display_name,
          bio,
          interests,
          availability_hours_per_week
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        ON CONFLICT (
          user_id
        )
        DO UPDATE SET
          display_name =
            EXCLUDED.display_name,
          bio =
            EXCLUDED.bio,
          interests =
            EXCLUDED.interests,
          availability_hours_per_week =
            EXCLUDED.availability_hours_per_week
        RETURNING
          profile_id,
          user_id,
          display_name,
          bio,
          interests,
          availability_hours_per_week
      `,
      [
        userId,
        cleanDisplayName,
        cleanBio,
        cleanInterests,
        hours
      ]
    );


  if (
    cleanedSkills ===
    null
  ) {
    return result.rows[0];
  }


  await pool.query(
    `
      DELETE FROM user_skills
      WHERE user_id = $1
    `,
    [
      userId
    ]
  );


  for (
    const skill of cleanedSkills
  ) {
    const existingSkillResult =
      await pool.query(
        `
          SELECT
            skill_id
          FROM skills
          WHERE LOWER(name) =
                LOWER($1)
          LIMIT 1
        `,
        [
          skill.name
        ]
      );


    let skillId;


    if (
      existingSkillResult.rows
        .length >
      0
    ) {
      skillId =
        existingSkillResult
          .rows[0]
          .skill_id;
    }
    else {
      const createdSkillResult =
        await pool.query(
          `
            INSERT INTO skills (
              name,
              category
            )
            VALUES (
              $1,
              $2
            )
            RETURNING
              skill_id
          `,
          [
            skill.name,
            skill.category
          ]
        );


      skillId =
        createdSkillResult
          .rows[0]
          .skill_id;
    }


    await pool.query(
      `
        INSERT INTO user_skills (
          user_id,
          skill_id,
          proficiency
        )
        VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT (
          user_id,
          skill_id
        )
        DO UPDATE SET
          proficiency =
            EXCLUDED.proficiency
      `,
      [
        userId,
        skillId,
        skill.proficiency
      ]
    );
  }


  return result.rows[0];
}


module.exports = {
  getProfileByUserId,
  updateMyProfile,

  MAX_DISPLAY_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_INTERESTS_LENGTH,
  MAX_SKILL_NAME_LENGTH,
  MAX_SKILL_CATEGORY_LENGTH
};