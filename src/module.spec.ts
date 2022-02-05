import { IamExported } from "./module";
test("IamExported returns greeting", () => {
  expect(IamExported("Symbol")).toContain("Hello, Symbol!!");
});
