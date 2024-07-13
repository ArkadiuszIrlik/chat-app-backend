function updateCommandValue(patch: any[], pathToCommand: string, value: any) {
  patch.forEach((command) => {
    if (command?.path === pathToCommand) {
      command.value = value;
    }
  });
  return patch;
}

/** Checks if provided JSON Patch document includes a command
 * targeting a property at provided path.
 *
 * @param patch JSON Patch document
 * @param propertyPointer path to property you want to check, in JSON Pointer format
 * @returns boolean hasProperty value
 */
function checkIfPatchHasProperty(patch: any[], propertyPointer: string) {
  const hasProperty = !!patch.find(
    (command) => command.path === propertyPointer,
  );

  return hasProperty;
}

export {
  updateCommandValue,
  checkIfPatchHasProperty,
};
