package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/tencentyun/scf-go-lib/cloudfunction"
	"github.com/tencentyun/scf-go-lib/events"
)

const stableDocker2 = "v2.0-r9"
const stableVersion2 = "2.0.273"
const stableDocker3 = "v3.0-r6"
const stableVersion3 = "3.0.163"
const stableDocker4 = "v4.0.136"
const stableVersion4 = "v4.0.136"

const dockerImage = "ossrs/srs"
const dockerMirror = "registry.cn-hangzhou.aliyuncs.com/ossrs/srs"

type VersionResponse struct {
	// The matched latest version for client requested.
	MatchVersion      string `json:"match_version"`
	MatchDocker       string `json:"match_docker"`
	MatchDockerImage  string `json:"match_docker_image"`
	MatchDockerMirror string `json:"match_docker_mirror"`
	// The stable latest version, recommend to use.
	StableVersion      string `json:"stable_version"`
	StableDocker       string `json:"stable_docker"`
	StableDockerImage  string `json:"stable_docker_image"`
	StableDockerMirror string `json:"stable_docker_mirror"`
	// The timestamp of request.
	timestamp string `json:"-"`
}

func (v *VersionResponse) String() string {
	return fmt.Sprintf("stable=%v,%v, match=%v%v", v.StableDocker, v.StableVersion, v.MatchDocker, v.MatchVersion)
}

func handler(ctx context.Context, e events.APIGatewayRequest) (*VersionResponse, error) {
	q := url.Values(e.QueryString)
	version, ts := q.Get("version"), q.Get("ts")

	// The recommend version.
	if version == "" {
		version = "v0.0.0"
	}

	// Transform version to vx.x.x
	if !strings.HasPrefix(version, "v") {
		version = "v" + version
	}
	if !strings.Contains(version, ".") {
		version += ".0.0"
	}

	// Build response.
	res := &VersionResponse{
		StableDocker:  stableDocker3,
		StableVersion: stableVersion3,
		timestamp:     ts,
	}

	if strings.HasPrefix(version, "v2.") {
		res.MatchDocker = stableDocker2
		res.MatchVersion = stableVersion2
	} else if strings.HasPrefix(version, "v3.") {
		res.MatchDocker = stableDocker3
		res.MatchVersion = stableVersion3
	} else if strings.HasPrefix(version, "v4.") {
		res.MatchDocker = stableDocker4
		res.MatchVersion = stableVersion4
	} else {
		res.MatchDocker = stableDocker3
		res.MatchVersion = stableVersion3
	}
	res.MatchDockerImage = fmt.Sprintf("%v:%v", dockerImage, res.MatchDocker)
	res.MatchDockerMirror = fmt.Sprintf("%v:%v", dockerMirror, res.MatchDocker)
	res.StableDockerImage = fmt.Sprintf("%v:%v", dockerImage, res.StableDocker)
	res.StableDockerMirror = fmt.Sprintf("%v:%v", dockerMirror, res.StableDocker)

	headers := make(http.Header)
	for k, v := range e.Headers {
		for _, value := range strings.Split(v, ",") {
			headers.Add(k, value)
		}
	}

	q.Set("rip", headers.Get("X-Forwarded-For"))
	fmt.Printf("SRS id=%v, version=%v, eip=%v, rip=%v, res=(%v), REGION=%v by %v\n", q.Get("id"), version, q.Get("eip"), q.Get("rip"), res, os.Getenv("REGION"), e)

	return res, nil
}

func main() {
	cloudfunction.Start(handler)
}
