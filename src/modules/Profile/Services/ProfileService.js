import api from '../../../api/client';

export const getProfileData = async () => {
    const response = await api.get('/user/profile');
    return response.data;
};

export const getPromptHistory = async () => {
    const response = await api.get('/user/prompts');
    return response.data;
};