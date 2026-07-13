import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "../src/App.jsx";

test("demo Console exposes Runs with linked Initiative and Evidence", async () => {
  render(<App />);
  expect(await screen.findByRole("heading", { name: "Overview" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Runs" }));
  expect(await screen.findByRole("heading", { name: "Runs" })).toBeVisible();
  await waitFor(() => expect(screen.getByText(/"initiative_id": "initiative:fictional:harbor-review"/)).toBeVisible());
  expect(screen.getByText(/"bundle_id": "evidence:fictional:harbor-review"/)).toBeVisible();
});
