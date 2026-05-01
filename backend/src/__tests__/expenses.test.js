import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createDatabase } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unit & integration tests for the Expense Tracker backend.
 *
 * Tests cover:
 * 1. Database schema and constraints
 * 2. Idempotency key behavior (preventing duplicate entries)
 * 3. Money storage as integers (cents/paise)
 * 4. Query filtering and sorting
 * 5. Total calculation accuracy
 */
describe("Expense Tracker Backend", () => {
  let db;
  const testDbPath = path.join(__dirname, "test.db");

  beforeAll(() => {
    // Use a separate test database
    db = createDatabase(testDbPath);
  });

  afterAll(() => {
    db.close();
    // Clean up test database
    try {
      fs.unlinkSync(testDbPath);
      fs.unlinkSync(testDbPath + "-wal");
      fs.unlinkSync(testDbPath + "-shm");
    } catch (e) {
      // Files may not exist, that's ok
    }
  });

  describe("Database Schema", () => {
    it("should create the expenses table", () => {
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'"
        )
        .all();
      expect(tables).toHaveLength(1);
    });

    it("should enforce amount_cents > 0 constraint", () => {
      expect(() => {
        db.prepare(
          "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
        ).run(uuidv4(), -100, "food", "test", "2025-05-01");
      }).toThrow();
    });

    it("should enforce amount_cents > 0 for zero values", () => {
      expect(() => {
        db.prepare(
          "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
        ).run(uuidv4(), 0, "food", "test", "2025-05-01");
      }).toThrow();
    });
  });

  describe("Money Storage (Integer Cents)", () => {
    it("should store ₹42.50 as 4250 cents", () => {
      const id = uuidv4();
      const amountCents = Math.round(42.5 * 100);

      db.prepare(
        "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
      ).run(id, amountCents, "food", "Lunch", "2025-05-01");

      const row = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
      expect(row.amount_cents).toBe(4250);
      // Convert back to human-readable
      expect(row.amount_cents / 100).toBe(42.5);
    });

    it("should handle precise decimal amounts correctly", () => {
      const id = uuidv4();
      // This is a classic floating-point trap: 0.1 + 0.2 ≠ 0.3 in IEEE 754
      // But Math.round(0.30 * 100) = 30, which is correct
      const amountCents = Math.round(0.3 * 100);

      db.prepare(
        "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
      ).run(id, amountCents, "food", "Small item", "2025-05-01");

      const row = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
      expect(row.amount_cents).toBe(30);
    });

    it("should calculate totals accurately using integer arithmetic", () => {
      // Insert expenses with amounts that would cause floating-point errors
      const amounts = [10.1, 10.2, 10.3]; // Sum = 30.6, but 10.1+10.2+10.3 in float ≠ 30.6
      const ids = [];

      for (const amount of amounts) {
        const id = uuidv4();
        ids.push(id);
        db.prepare(
          "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
        ).run(id, Math.round(amount * 100), "test-total", "test", "2025-05-01");
      }

      const result = db
        .prepare(
          "SELECT SUM(amount_cents) as total_cents FROM expenses WHERE category = ?"
        )
        .get("test-total");

      // Integer arithmetic gives us exact result
      expect(result.total_cents).toBe(3060);
      expect(result.total_cents / 100).toBe(30.6);
    });
  });

  describe("Idempotency", () => {
    it("should prevent duplicate entries with the same idempotency key", () => {
      const id1 = uuidv4();
      const id2 = uuidv4();
      const idempotencyKey = uuidv4();

      // First insert succeeds
      db.prepare(
        "INSERT INTO expenses (id, idempotency_key, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(id1, idempotencyKey, 1000, "food", "First attempt", "2025-05-01");

      // Second insert with same key should fail
      expect(() => {
        db.prepare(
          "INSERT INTO expenses (id, idempotency_key, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(
          id2,
          idempotencyKey,
          1000,
          "food",
          "Retry attempt",
          "2025-05-01"
        );
      }).toThrow();

      // Only one record should exist
      const existing = db
        .prepare("SELECT * FROM expenses WHERE idempotency_key = ?")
        .get(idempotencyKey);
      expect(existing.id).toBe(id1);
      expect(existing.description).toBe("First attempt");
    });

    it("should allow entries without idempotency keys", () => {
      const id1 = uuidv4();
      const id2 = uuidv4();

      // Both inserts without idempotency key should succeed
      db.prepare(
        "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
      ).run(id1, 500, "food", "No key 1", "2025-05-01");

      db.prepare(
        "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
      ).run(id2, 600, "food", "No key 2", "2025-05-01");

      const count = db
        .prepare(
          "SELECT COUNT(*) as count FROM expenses WHERE id IN (?, ?)"
        )
        .get(id1, id2);
      expect(count.count).toBe(2);
    });
  });

  describe("Filtering and Sorting", () => {
    beforeAll(() => {
      // Insert test data for filtering/sorting
      const entries = [
        { category: "filter-food", date: "2025-01-15", amount: 1500 },
        { category: "filter-food", date: "2025-03-20", amount: 2000 },
        { category: "filter-transport", date: "2025-02-10", amount: 3000 },
      ];

      for (const entry of entries) {
        db.prepare(
          "INSERT INTO expenses (id, amount_cents, category, description, date) VALUES (?, ?, ?, ?, ?)"
        ).run(uuidv4(), entry.amount, entry.category, "test", entry.date);
      }
    });

    it("should filter by category", () => {
      const results = db
        .prepare("SELECT * FROM expenses WHERE category = ?")
        .all("filter-food");
      expect(results).toHaveLength(2);
      results.forEach((r) => expect(r.category).toBe("filter-food"));
    });

    it("should sort by date descending (newest first)", () => {
      const results = db
        .prepare(
          "SELECT * FROM expenses WHERE category LIKE 'filter-%' ORDER BY date DESC"
        )
        .all();
      expect(results).toHaveLength(3);
      expect(results[0].date).toBe("2025-03-20");
      expect(results[1].date).toBe("2025-02-10");
      expect(results[2].date).toBe("2025-01-15");
    });

    it("should sort by date ascending (oldest first)", () => {
      const results = db
        .prepare(
          "SELECT * FROM expenses WHERE category LIKE 'filter-%' ORDER BY date ASC"
        )
        .all();
      expect(results[0].date).toBe("2025-01-15");
      expect(results[2].date).toBe("2025-03-20");
    });

    it("should calculate filtered totals correctly", () => {
      const result = db
        .prepare(
          "SELECT SUM(amount_cents) as total_cents FROM expenses WHERE category = ?"
        )
        .get("filter-food");
      expect(result.total_cents).toBe(3500); // 1500 + 2000
    });
  });
});
