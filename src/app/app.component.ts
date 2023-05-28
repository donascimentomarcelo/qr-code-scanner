import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import jsQR from 'jsqr';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Observable, Subject, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  public webcamImage!: WebcamImage;

  // toggle webcam on/off
  public showWebcam = true;
  public allowCameraSwitch = false;
  public facingMode: string = 'environment';
  public multipleWebcamsAvailable = false;
  public deviceId!: string;
  public qrcode!: string;
  public errors: WebcamInitError[] = [];

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<
    boolean | string
  >();

  @ViewChild('webcam', { static: true })
  private webcam!: ElementRef<HTMLElement>;

  public ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs().then(
      (mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      }
    );
  }

  ngAfterViewInit(): void {
    this.spyCamera();
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.spyCamera();
  }

  public spyCamera() {
    const { clientWidth, clientHeight } = this.video;

    console.log(this.webcam.nativeElement);
    console.log(this.canvas.width);
    console.log(this.canvas.height);

    const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(this.video, 0, 0, clientWidth, clientHeight);

    const inversionAttempts = 'dontInvert';
    const image = ctx.getImageData(0, 0, clientWidth, clientHeight);
    const qrcode = jsQR(image.data, image.width, clientHeight, {
      inversionAttempts,
    });

    if (qrcode) {
      const { data } = qrcode;
      console.log(data);
      this.qrcode = data;
    } else {
      timer(1000)
        // .pipe(takeUntil(this.destroyer))
        .subscribe(() => this.spyCamera());
    }
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  public get video(): HTMLVideoElement {
    return this.webcam.nativeElement.getElementsByTagName(
      'video'
    )[0] as HTMLVideoElement;
  }

  public get canvas(): HTMLCanvasElement {
    return this.webcam.nativeElement.getElementsByTagName(
      'canvas'
    )[0] as HTMLCanvasElement;
  }

  public get videoOptions(): MediaTrackConstraints {
    const result: MediaTrackConstraints = {};
    if (this.facingMode && this.facingMode !== '') {
      result.facingMode = { ideal: this.facingMode };
    }
    return result;
  }
}
