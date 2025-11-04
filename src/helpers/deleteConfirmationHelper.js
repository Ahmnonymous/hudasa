// Utility function to create delete confirmation handlers
export const createDeleteHandler = (showDeleteConfirmation, apiCall, onSuccess, itemType = "item") => {
  return (item) => {
    const itemName = item.name || item.title || item.file_filename || `${itemType} #${item.id}`;
    
    showDeleteConfirmation({
      id: item.id,
      name: itemName,
      type: itemType,
      message: `This ${itemType} will be permanently removed from the system.`
    }, async () => {
      await apiCall(item.id);
      onSuccess();
    });
  };
};

// Example usage:
// const handleDelete = createDeleteHandler(
//   showDeleteConfirmation,
//   (id) => axiosApi.delete(`${API_BASE_URL}/items/${id}`),
//   () => {
//     showAlert("Item deleted successfully", "success");
//     fetchItems();
//   },
//   "item"
// );
