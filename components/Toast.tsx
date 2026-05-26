import Toast from "react-native-toast-message";

export const showSuccessToast = (
  title: string,
  message: string
) => {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,

    position: "top",

    visibilityTime: 2500,

    text1Style: {
      fontSize: 18,
      fontWeight: "700",
    },

    text2Style: {
      fontSize: 14,
    },
  });
};

export const showErrorToast = (
  title: string,
  message: string
) => {
  Toast.show({
    type: "error",
    text1: title,
    text2: message,

    position: "top",

    visibilityTime: 2500,

    text1Style: {
      fontSize: 18,
      fontWeight: "700",
    },

    text2Style: {
      fontSize: 14,
    },
  });
};