package com.remembermap.service;

import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MinioStorageServiceTest {

    @Mock
    private MinioClient minioClient;

    private MinioStorageService minioStorageService;

    private final String bucket = "test-bucket";

    @BeforeEach
    void setUp() {
        minioStorageService = new MinioStorageService(minioClient, bucket);
    }

    @Test
    void testUploadFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "dummy image content".getBytes()
        );

        String objectName = "photos/user1/test.jpg";
        String result = minioStorageService.uploadFile(file, objectName);

        assertThat(result).isEqualTo(objectName);
        verify(minioClient, times(1)).putObject(any(PutObjectArgs.class));
    }

    @Test
    void testGetFile() throws Exception {
        GetObjectResponse getObjectResponse = mock(GetObjectResponse.class);
        when(minioClient.getObject(any(GetObjectArgs.class))).thenReturn(getObjectResponse);

        InputStream stream = minioStorageService.getFile("photos/user1/test.jpg");

        assertThat(stream).isNotNull();
        verify(minioClient, times(1)).getObject(any(GetObjectArgs.class));
    }

    @Test
    void testDeleteFile() throws Exception {
        minioStorageService.deleteFile("photos/user1/test.jpg");

        verify(minioClient, times(1)).removeObject(any(RemoveObjectArgs.class));
    }
}
