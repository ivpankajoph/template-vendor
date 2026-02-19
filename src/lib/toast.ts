import Swal from "sweetalert2";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export const toastSuccess = (message: string) =>
  toast.fire({ icon: "success", title: message });

export const toastError = (message: string) =>
  toast.fire({ icon: "error", title: message });
