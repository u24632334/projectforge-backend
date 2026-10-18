/**
 * TeamHealthSubmissionRepository
 *
 * Data-access layer behind the anonymous Team Health
 * submission flow.
 *
 * The anonymous response and the duplicate-prevention
 * receipt are deliberately stored separately so the
 * response itself contains no membership identifier.
 *
 * However, both records must be created atomically.
 */
class TeamHealthSubmissionRepository {

  constructor(pool) {
    this.pool =
      pool;
  }


  /**
   * Checks whether a project membership has already
   * submitted for the requested Team Health period.
   *
   * This query never accesses the anonymous response.
   */
  async hasSubmitted(
    membershipId,
    periodStart
  ) {
    const {
      rows
    } =
      await this.pool.query(
        `
          SELECT 1
          FROM team_health_submission_receipts
          WHERE
            membership_id = $1
            AND period_start = $2
          LIMIT 1
        `,
        [
          membershipId,
          periodStart,
        ]
      );


    return (
      rows.length >
      0
    );
  }


  /**
   * Stores only the anonymous Team Health response.
   *
   * No user ID or membership ID is accepted here.
   *
   * This method remains available for isolated repository
   * tests, but normal submission flow should use submit()
   * so the response and receipt are transactional.
   */
  async insertResponse(
    response
  ) {
    const {
      rows
    } =
      await this.pool.query(
        `
          INSERT INTO team_health_responses (
            response_id,
            project_id,
            period_start,
            workload,
            communication,
            blocker_severity,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
          RETURNING *
        `,
        [
          response.responseId,
          response.projectId,
          response.periodStart,
          response.workload,
          response.communication,
          response.blockerSeverity,
          response.createdAt,
        ]
      );


    return (
      rows[0] ||
      null
    );
  }


  /**
   * Stores only the duplicate-prevention receipt.
   *
   * The receipt contains the project membership identity
   * but contains none of the anonymous Team Health scores.
   *
   * This method remains available for isolated repository
   * tests, but normal submission flow should use submit().
   */
  async insertReceipt(
    receipt
  ) {
    await this.pool.query(
      `
        INSERT INTO team_health_submission_receipts (
          receipt_id,
          membership_id,
          period_start,
          submitted_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
      `,
      [
        receipt.receiptId,
        receipt.membershipId,
        receipt.periodStart,
        receipt.submittedAt,
      ]
    );
  }


  /**
   * Atomically stores:
   *
   * 1. the anonymous Team Health response; and
   * 2. the separate duplicate-prevention receipt.
   *
   * If either INSERT fails, both are rolled back.
   *
   * This prevents a response from being counted when its
   * receipt was not created, and also protects against
   * concurrent duplicate submissions where two requests
   * pass the friendly hasSubmitted() pre-check together.
   */
  async submit(
    response,
    receipt
  ) {
    const client =
      await this.pool.connect();


    try {
      await client.query(
        "BEGIN"
      );


      const {
        rows
      } =
        await client.query(
          `
            INSERT INTO team_health_responses (
              response_id,
              project_id,
              period_start,
              workload,
              communication,
              blocker_severity,
              created_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7
            )
            RETURNING *
          `,
          [
            response.responseId,
            response.projectId,
            response.periodStart,
            response.workload,
            response.communication,
            response.blockerSeverity,
            response.createdAt,
          ]
        );


      await client.query(
        `
          INSERT INTO team_health_submission_receipts (
            receipt_id,
            membership_id,
            period_start,
            submitted_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
        `,
        [
          receipt.receiptId,
          receipt.membershipId,
          receipt.periodStart,
          receipt.submittedAt,
        ]
      );


      await client.query(
        "COMMIT"
      );


      return (
        rows[0] ||
        null
      );
    }
    catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      }
      catch {
        /*
         * Preserve the original database error.
         * The caller should receive the failure that caused
         * the transaction to abort rather than a rollback error.
         */
      }


      throw error;
    }
    finally {
      client.release();
    }
  }

}


module.exports =
  TeamHealthSubmissionRepository;