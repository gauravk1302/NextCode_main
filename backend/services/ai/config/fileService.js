import dotenv from "dotenv";
dotenv.config();

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || "http://localhost:8003";


// =====================================================
// REQUEST
// =====================================================
// This will come to action when AI service talks with the File service, all the things pass with this, it will add the url/body/method into a request( make it ) and send it and give response

const request = async (
  url,
  options = {},
  userId
) => {
  console.log(
    "================================="
  );

  console.log(
    "FILE SERVICE REQUEST:",
    options.method || "GET",
    url
  );

  console.log(
    "USER ID:",
    userId
  );

  const response = await fetch(
    url,
    {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        ...(userId
          ? {
              "x-user-id":
                String(userId),
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  const text =
    await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      message: text,
    };
  }

  console.log(
    "FILE SERVICE RESPONSE:",
    response.status,
    data
  );

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `File service returned ${response.status}`
    );
  }

  return data;
};


// Get project tree

export const getProjectTree = async (
    projectId,
    userId
) =>{

    if(!projectId){
        throw new Error(
            "ProjectId is required."
        )
    }

    return request(
        `${FILE_SERVICE_URL}/tree/${projectId}`,
        {},
        userId
    )
};

// Get single file

export const getFile = async (
    fileId,
    userId
)=>{

    if(!fileId){
        throw new Error(
            "FileId is required."
        )
    }

    return request(
        `${FILE_SERVICE_URL}/${fileId}`,
        {},
        userId
    )
}

// Create Folder
export const createFolder = async (
    body,
    userId
) => {

    if(!body?.projectId){
        throw new Error(
            "ProjectId is required."
        )
    }

    if(!body?.name){
        throw new Error(
            "Folder name is required."
        )
    }

    return request(
        `${FILE_SERVICE_URL}/folder`,
        {
            method: "POST",
            body: JSON.stringify(body)
        },
        userId
    )
};

// Create File
export const createFile = async (
    body,
    userId
) => {

    if(!body?.projectId){
        throw new Error(
            "ProjectId is required."
        )
    }

    if(!body?.name){
        throw new Error(
            "File name is required."
        )
    }

    return request(
        `${FILE_SERVICE_URL}/file`,
        {
            method: "POST",
            body: JSON.stringify(
                body
            )
        },
        userId
    )
}

// Update File
export const updateFile = async( 
    fileId,
    body,
    userId
) => {

    if(!fileId){
        throw new Error(
            "FileId is required."
        )
    }

    return request(
        `${FILE_SERVICE_URL}/${fileId}`,
        {
            method: "PUT",
            body: JSON.stringify(body)
        },
        userId
    )
}


// Delete File
export const deleteFile = async( 
    fileId,
    userId
) => {

    if(!fileId){
        throw new Error(
            "FileId is required."
        )
    }

    return request(
        `${FILE_SERVICE_URL}/${fileId}`,
        {
            method: "DELETE"
        },
        userId
    )
};
