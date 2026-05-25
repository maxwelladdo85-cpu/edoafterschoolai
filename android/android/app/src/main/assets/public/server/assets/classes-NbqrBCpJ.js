const CLASS_GROUPS = [
  {
    label: "Early Childhood / Nursery",
    classes: ["Nursery 1", "Nursery 2", "Kindergarten (KG) / Nursery 3"]
  },
  {
    label: "Primary",
    classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"]
  },
  {
    label: "Junior Secondary",
    classes: ["JSS 1 (Basic 7)", "JSS 2 (Basic 8)", "JSS 3 (Basic 9)"]
  }
];
CLASS_GROUPS.flatMap((g) => g.classes);
export {
  CLASS_GROUPS as C
};
