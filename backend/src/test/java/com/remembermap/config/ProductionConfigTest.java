package com.remembermap.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.FileSystemResource;
import org.springframework.util.unit.DataSize;

/**
 * Guards the production application.yml (the test classpath shadows it with its own application.yml,
 * so it is loaded from the source tree and its ${ENV:default} placeholders resolved to their defaults).
 */
class ProductionConfigTest {

    private StandardEnvironment env;

    @BeforeEach
    void loadMainConfig() {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new FileSystemResource("src/main/resources/application.yml"));
        Properties properties = yaml.getObject();

        env = new StandardEnvironment();
        env.getPropertySources().addLast(new PropertiesPropertySource("main-application-yml", properties));
    }

    private DataSize dataSize(String key) {
        String value = env.getProperty(key);
        assertThat(value).as(key).isNotBlank();
        return DataSize.parse(value);
    }

    @Test
    void acceptsPhoneSizedPhotoUploads() {
        assertThat(dataSize("spring.servlet.multipart.max-file-size")).isGreaterThanOrEqualTo(DataSize.ofMegabytes(10));
    }

    @Test
    void requestLimitCoversTheFileLimit() {
        assertThat(dataSize("spring.servlet.multipart.max-request-size"))
                .isGreaterThanOrEqualTo(dataSize("spring.servlet.multipart.max-file-size"));
    }

    @Test
    void honoursProxyHeadersFromTheNginxFrontends() {
        assertThat(env.getProperty("server.forward-headers-strategy")).isEqualTo("framework");
    }

    @Test
    void shutsDownGracefullySoInFlightUploadsFinishOnRedeploy() {
        assertThat(env.getProperty("server.shutdown")).isEqualTo("graceful");
    }
}
