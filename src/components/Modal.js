import React from "react";

export const Modal = ({
  type,
  showModal,
  setShowModal,
  modalHeader,
  modalBody,
  modalFooterBtnText,
}) => {
  return (
    <>
      {showModal ? (
        <>
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex bg-white justify-between p-5 border-b border-solid border-gray-300 rounded-t max-w-3xl">
                  <h3
                    className={`text-lg ${
                      type === "error" ? "text-red-500" : "text-green-500"
                    } font-semibold`}
                  >
                    {modalHeader}
                  </h3>
                  <button
                    className="bg-transparent border-0 text-gray-800 float-right"
                    onClick={() => setShowModal(false)}
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full p-6">
                  {modalBody}
                </div>
                <div className="flex bg-white items-center justify-center p-6 border-t border-solid border-blueGray-200 rounded-b">
                  <button
                    className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none border-2 border-gray-500 rounded-md focus:outline-none mr-1 mb-1"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    {modalFooterBtnText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};
