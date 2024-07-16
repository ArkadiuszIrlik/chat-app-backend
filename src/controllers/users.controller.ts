import { Request, Response, NextFunction } from 'express';
import * as usersService from '@services/users.service.js';
import * as patchService from '@services/patch.service.js';
import * as uploadedFilesService from '@services/uploadedFiles.service.js';
import * as imagesService from '@services/images.service.js';
import * as socketService from '@services/socket.service.js';
import fileUpload from 'express-fileupload';
import { ImageObject } from '@src/typesModule.js';

export async function getUserFromAuth(req: Request, res: Response) {
  const accessingUserId = req.decodedAuth?.userId;
  if (!accessingUserId) {
    return res.status(401).json({ message: 'Missing user credentials' });
  }
  const user = await usersService.getUser(accessingUserId, {
    populateServersIn: true,
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res
    .status(200)
    .json(
      usersService.getClientSafeSubset(user, usersService.UserAuthLevel.Self),
    );
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.params.userId;

  // type tested by validation middleware
  const tempPatch = req.files?.patch as fileUpload.UploadedFile;

  const patchBuffer = await uploadedFilesService.readTempFile(tempPatch);
  uploadedFilesService.removeTempFile(tempPatch);

  const patch = JSON.parse(patchBuffer.toString());
  if (!Array.isArray(patch)) {
    return res.status(404).json({ message: 'Invalid PATCH data' });
  }

  const isProfileImgUpdate = patchService.checkIfPatchHasProperty(
    patch,
    '/profileImg',
  );

  let profileImgObj: ImageObject | null = null;
  if (isProfileImgUpdate) {
    // type tested by validation middleware
    const profileImgFile = req.files?.profileImg as fileUpload.UploadedFile;
    if (!profileImgFile) {
      return res.status(404).json({ message: 'Missing profileImg upload' });
    }
    profileImgObj = await imagesService.saveUserProfileImage(profileImgFile);
    patchService.updateCommandValue(patch, '/profileImg', profileImgObj);
  }

  const user =
    req.context.requestedUser ?? (await usersService.getUser(userId));
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    await usersService.patchUser(user, patch);
  } catch (err) {
    if (isProfileImgUpdate && profileImgObj) {
      await imagesService.removeImage(profileImgObj);
    }
    return next(err);
  }

  const userSocketRooms = await socketService.getRoomsUserIsIn(
    req.socketIo,
    userId,
  );
  socketService.emitUserUpdated(
    req.socketIo,
    userSocketRooms,
    usersService.getClientSafeSubset(
      user,
      usersService.UserAuthLevel.OtherUser,
    ),
  );

  return res.status(200).json({ message: 'User updated' });
}
