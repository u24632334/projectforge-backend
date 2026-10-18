const {
  updateMyProfile,
  getProfileByUserId
} = require(
  "../services/profileService"
);


const {
  pool
} = require(
  "../config/db"
);


jest.mock(
  "../config/db",
  () => ({
    pool: {
      query:
        jest.fn()
    }
  })
);


describe(
  "PFG-29: Profile Validation & Availability Unit Tests",
  () => {

    const mockUserId =
      "123e4567-e89b-12d3-a456-426614174000";


    beforeEach(() => {
      jest.clearAllMocks();
    });


    test(
      "should throw an error if availability hours are negative",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            -5
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Availability hours must be between 0 and 168."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should throw an error if availability hours exceed 168",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            175
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Availability hours must be between 0 and 168."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should reject decimal availability hours",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10.5
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Availability hours must be a whole number."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should throw an error if display name is blank",
      async () => {

        const invalidData = {
          displayName:
            "   ",

          availabilityHoursPerWeek:
            10
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Display name cannot be blank."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should successfully update profile when all fields are valid",
      async () => {

        const validData = {
          displayName:
            "Kamesh",

          bio:
            "Computer Engineering Student",

          interests: [
            "Embedded Systems",
            "React"
          ],

          availabilityHoursPerWeek:
            15
        };


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-profile-id",

                user_id:
                  mockUserId,

                display_name:
                  "Kamesh",

                bio:
                  "Computer Engineering Student",

                interests: [
                  "Embedded Systems",
                  "React"
                ],

                availability_hours_per_week:
                  15
              }
            ]
          });


        const result =
          await updateMyProfile(
            mockUserId,
            validData
          );


        expect(
          result
        ).toBeDefined();


        expect(
          result
            .availability_hours_per_week
        ).toBe(
          15
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    test(
      "should accept availability hours at the exact lower boundary of 0",
      async () => {

        const validData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            0
        };


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-id",

                availability_hours_per_week:
                  0
              }
            ]
          });


        const result =
          await updateMyProfile(
            mockUserId,
            validData
          );


        expect(
          result
            .availability_hours_per_week
        ).toBe(
          0
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    test(
      "should accept availability hours at the exact upper boundary of 168",
      async () => {

        const validData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            168
        };


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-id",

                availability_hours_per_week:
                  168
              }
            ]
          });


        const result =
          await updateMyProfile(
            mockUserId,
            validData
          );


        expect(
          result
            .availability_hours_per_week
        ).toBe(
          168
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    test(
      "should throw an error if availability hours are not a valid number",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            "not-a-number"
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Availability hours must be between 0 and 168."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should throw an error if display name is null or missing",
      async () => {

        const invalidData = {
          displayName:
            null,

          availabilityHoursPerWeek:
            10
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Display name cannot be blank."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should reject an invalid skill proficiency before writing to the database",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                "React",

              category:
                "Frontend",

              proficiency:
                "EXPERT"
            }
          ]
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Skill proficiency must be BEGINNER, INTERMEDIATE or ADVANCED."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should reject duplicate skill names",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                "React",

              category:
                "Frontend",

              proficiency:
                "BEGINNER"
            },

            {
              name:
                "react",

              category:
                "Frontend",

              proficiency:
                "ADVANCED"
            }
          ]
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Each skill can only be added once."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should synchronise submitted skills with user_skills",
      async () => {

        const validData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                "React",

              category:
                "Frontend",

              proficiency:
                "ADVANCED"
            }
          ]
        };


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-profile-id",

                user_id:
                  mockUserId,

                display_name:
                  "Kamesh",

                availability_hours_per_week:
                  10
              }
            ]
          });


        pool.query
          .mockResolvedValueOnce({
            rows: []
          });


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                skill_id:
                  "skill-react"
              }
            ]
          });


        pool.query
          .mockResolvedValueOnce({
            rows: []
          });


        const result =
          await updateMyProfile(
            mockUserId,
            validData
          );


        expect(
          result.display_name
        ).toBe(
          "Kamesh"
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          4
        );


        expect(
          pool.query.mock
            .calls[1][0]
        ).toContain(
          "DELETE FROM user_skills"
        );


        expect(
          pool.query.mock
            .calls[2][0]
        ).toContain(
          "LOWER(name)"
        );


        expect(
          pool.query.mock
            .calls[3][0]
        ).toContain(
          "INSERT INTO user_skills"
        );


        expect(
          pool.query.mock
            .calls[3][1]
        ).toEqual([
          mockUserId,
          "skill-react",
          "ADVANCED"
        ]);
      }
    );


    test(
      "should create a skill when it does not already exist",
      async () => {

        const validData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                "FPGA",

              category:
                "Electronics",

              proficiency:
                "INTERMEDIATE"
            }
          ]
        };


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-profile-id",

                user_id:
                  mockUserId,

                display_name:
                  "Kamesh"
              }
            ]
          })

          .mockResolvedValueOnce({
            rows: []
          })

          .mockResolvedValueOnce({
            rows: []
          })

          .mockResolvedValueOnce({
            rows: [
              {
                skill_id:
                  "skill-fpga"
              }
            ]
          })

          .mockResolvedValueOnce({
            rows: []
          });


        await updateMyProfile(
          mockUserId,
          validData
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          5
        );


        expect(
          pool.query.mock
            .calls[3][0]
        ).toContain(
          "INSERT INTO skills"
        );


        expect(
          pool.query.mock
            .calls[3][1]
        ).toEqual([
          "FPGA",
          "Electronics"
        ]);


        expect(
          pool.query.mock
            .calls[4][1]
        ).toEqual([
          mockUserId,
          "skill-fpga",
          "INTERMEDIATE"
        ]);
      }
    );


    test(
      "should remove all linked skills when an empty skills list is submitted",
      async () => {

        const validData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: []
        };


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-profile-id"
              }
            ]
          })

          .mockResolvedValueOnce({
            rows: []
          });


        await updateMyProfile(
          mockUserId,
          validData
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          2
        );


        expect(
          pool.query.mock
            .calls[1][0]
        ).toContain(
          "DELETE FROM user_skills"
        );
      }
    );


    test(
      "should reject a display name longer than 120 characters",
      async () => {

        const invalidData = {
          displayName:
            "A".repeat(121),

          availabilityHoursPerWeek:
            10
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Maximum characters exceeded. Display name may not exceed 120 characters."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should reject a bio longer than 1000 characters",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          bio:
            "A".repeat(1001),

          availabilityHoursPerWeek:
            10
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Maximum characters exceeded. Bio may not exceed 1000 characters."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should reject interests exceeding 1000 characters in total",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          interests: [
            "A".repeat(1001)
          ],

          availabilityHoursPerWeek:
            10
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Maximum characters exceeded. Interests may not exceed 1000 characters in total."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should accept a skill name at the exact 120 character boundary",
      async () => {

        const boundarySkillName =
          "A".repeat(120);


        const validData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                boundarySkillName,

              category:
                "Testing",

              proficiency:
                "BEGINNER"
            }
          ]
        };


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-profile-id",

                user_id:
                  mockUserId,

                display_name:
                  "Kamesh",

                availability_hours_per_week:
                  10
              }
            ]
          })

          .mockResolvedValueOnce({
            rows: []
          })

          .mockResolvedValueOnce({
            rows: [
              {
                skill_id:
                  "skill-boundary"
              }
            ]
          })

          .mockResolvedValueOnce({
            rows: []
          });


        await expect(
          updateMyProfile(
            mockUserId,
            validData
          )
        ).resolves.toBeDefined();


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          4
        );


        expect(
          pool.query.mock
            .calls[2][1]
        ).toEqual([
          boundarySkillName
        ]);
      }
    );


    test(
      "should reject a skill name longer than 120 characters",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                "A".repeat(121),

              category:
                "Testing",

              proficiency:
                "BEGINNER"
            }
          ]
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Maximum characters exceeded. Skill name may not exceed 120 characters."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should safely reject a 50000 character skill name",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                "A".repeat(50000),

              category:
                "Testing",

              proficiency:
                "BEGINNER"
            }
          ]
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Maximum characters exceeded. Skill name may not exceed 120 characters."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );


    test(
      "should reject a skill category longer than 120 characters",
      async () => {

        const invalidData = {
          displayName:
            "Kamesh",

          availabilityHoursPerWeek:
            10,

          skills: [
            {
              name:
                "React",

              category:
                "A".repeat(121),

              proficiency:
                "BEGINNER"
            }
          ]
        };


        await expect(
          updateMyProfile(
            mockUserId,
            invalidData
          )
        ).rejects.toThrow(
          "Maximum characters exceeded. Skill category may not exceed 120 characters."
        );


        expect(
          pool.query
        ).not.toHaveBeenCalled();
      }
    );
  }
);


describe(
  "PFG-27: Retrieve Profile, Skills & Completed Projects Unit Tests",
  () => {

    const mockUserId =
      "123e4567-e89b-12d3-a456-426614174000";


    beforeEach(() => {
      jest.clearAllMocks();
    });


    test(
      "should return null if user does not exist in the database",
      async () => {

        pool.query
          .mockResolvedValueOnce({
            rows: []
          });


        const result =
          await getProfileByUserId(
            mockUserId
          );


        expect(
          result
        ).toBeNull();


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );


    test(
      "should return profile, skills and approved completed projects for an existing user",
      async () => {

        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-profile-id",

                user_id:
                  mockUserId,

                email:
                  "student@up.ac.za",

                system_role:
                  "STUDENT",

                display_name:
                  "Kamesh",

                bio:
                  "Computer Engineering Student",

                interests: [
                  "Embedded Systems",
                  "React"
                ],

                availability_hours_per_week:
                  15
              }
            ]
          });


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                skill_id:
                  "s1",

                name:
                  "JavaScript",

                category:
                  "Frontend",

                proficiency:
                  "ADVANCED"
              },

              {
                skill_id:
                  "s2",

                name:
                  "PostgreSQL",

                category:
                  "Database",

                proficiency:
                  "INTERMEDIATE"
              }
            ]
          });


        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                project_id:
                  "project-1",

                title:
                  "Completion Browser Test",

                description:
                  "Approved completed project.",

                category:
                  "Software Engineering",

                repository_url:
                  null,

                approved_at:
                  "2026-10-08T17:30:00Z"
              }
            ]
          });


        const result =
          await getProfileByUserId(
            mockUserId
          );


        expect(
          result
        ).toBeDefined();


        expect(
          result.email
        ).toBe(
          "student@up.ac.za"
        );


        expect(
          result.skills
        ).toHaveLength(
          2
        );


        expect(
          result.skills[0].name
        ).toBe(
          "JavaScript"
        );


        expect(
          result
            .approved_completed_projects
        ).toHaveLength(
          1
        );


        expect(
          result
            .approved_completed_projects[0]
            .title
        ).toBe(
          "Completion Browser Test"
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          3
        );


        expect(
          pool.query.mock
            .calls[2][0]
        ).toContain(
          "ss.status"
        );


        expect(
          pool.query.mock
            .calls[2][0]
        ).toContain(
          "'APPROVED'"
        );


        expect(
          pool.query.mock
            .calls[2][0]
        ).toContain(
          "p.status"
        );


        expect(
          pool.query.mock
            .calls[2][0]
        ).toContain(
          "'COMPLETED'"
        );


        expect(
          pool.query.mock
            .calls[2][1]
        ).toEqual([
          mockUserId
        ]);
      }
    );


    test(
      "should return empty skills and completed-project arrays when none exist",
      async () => {

        pool.query
          .mockResolvedValueOnce({
            rows: [
              {
                profile_id:
                  "mock-profile-id",

                user_id:
                  mockUserId,

                email:
                  "student@up.ac.za",

                system_role:
                  "STUDENT",

                display_name:
                  "Kamesh"
              }
            ]
          });


        pool.query
          .mockResolvedValueOnce({
            rows: []
          });


        pool.query
          .mockResolvedValueOnce({
            rows: []
          });


        const result =
          await getProfileByUserId(
            mockUserId
          );


        expect(
          result
        ).toBeDefined();


        expect(
          result.skills
        ).toEqual(
          []
        );


        expect(
          result
            .approved_completed_projects
        ).toEqual(
          []
        );


        expect(
          pool.query
        ).toHaveBeenCalledTimes(
          3
        );
      }
    );
  }
);