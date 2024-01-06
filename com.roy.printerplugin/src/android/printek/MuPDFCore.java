package com.artifex.mupdf;

import android.graphics.Bitmap;
import android.graphics.PointF;
import android.graphics.RectF;

public class MuPDFCore
{
	/* load our native library */
	static {
		System.loadLibrary("mupdf");
	}

	/* Readable members */
	private int pageNum  = -1;
	private int numPages = -1;
	public  float pageWidth;
	public  float pageHeight;

	/* The native functions */
	private static native int openFile(String filename);
	private static native int countPagesInternal();
	private static native void gotoPageInternal(int localActionPageNum);
	private static native float getPageWidth();
	private static native float getPageHeight();
	public static native void drawPage(Bitmap bitmap,
			int pageW, int pageH,
			int patchX, int patchY,
			int patchW, int patchH);
	public static native RectF[] searchPage(String text);
	public static native int getPageLink(int page, float x, float y);
	//public static native LinkInfo [] getPageLinksInternal(int page);
	//public static native OutlineItem [] getOutlineInternal();
	public static native boolean hasOutlineInternal();
	public static native boolean needsPasswordInternal();
	public static native boolean authenticatePasswordInternal(String password);
	public static native void destroying();

	public MuPDFCore(String filename) throws Exception
	{
		if (openFile(filename) <= 0)
		{
			throw new Exception("Failed to open "+filename);
		}
	}

	public  int getTotalPages()
	{
		if (numPages < 0)
			numPages = countPagesSynchronized();

		return numPages;
	}

	
	//把指定页转换为bitmap，并指定大小，如指定为0，则按PDF实际尺寸渲染
	public Bitmap getPageBitmap(int pageNum,int width,int height){
		if(pageNum>=getTotalPages()||pageNum<0){
			return null;
		}
		
		gotoPage(pageNum);
		Bitmap bitmap=Bitmap.createBitmap(width,height, Bitmap.Config.ARGB_8888);
		if(width==0||height==0){
			int wid=(int)pageWidth;
			int hig=(int)pageHeight;
			drawPage(0, bitmap, wid,
					hig, 
					0, 0,  wid,
					hig);
		}else{
			drawPage(0, bitmap, width,
					height, 
					0, 0,  width,
					height);
		}
		return bitmap;
	}
	
	public PointF getPageSize(int page) {
		gotoPage(page);
		return new PointF(pageWidth, pageHeight);
	}
	
	private synchronized int countPagesSynchronized() {
		return countPagesInternal();
	}

	/* Shim function */
	public void gotoPage(int page)
	{
		gotoPageInternal(page);
		this.pageNum = page;
		this.pageWidth = getPageWidth();
		this.pageHeight = getPageHeight();
	}

	public synchronized void onDestroy() {
		destroying();
	}

	public synchronized void drawPage(int page, Bitmap bitmap,
			int pageW, int pageH,
			int patchX, int patchY,
			int patchW, int patchH) {
		gotoPage(page);
		drawPage(bitmap, pageW, pageH, patchX, patchY, patchW, patchH);
	}

	public synchronized int hitLinkPage(int page, float x, float y) {
		return getPageLink(page, x, y);
	}

//	public synchronized LinkInfo [] getPageLinks(int page) {
//		return getPageLinksInternal(page);
//	}

	public synchronized RectF [] searchPage(int page, String text) {
		gotoPage(page);
		return searchPage(text);
	}

	public synchronized boolean hasOutline() {
		return hasOutlineInternal();
	}

//	public synchronized OutlineItem [] getOutline() {
//		return getOutlineInternal();
//	}

	public synchronized boolean needsPassword() {
		return needsPasswordInternal();
	}

	public synchronized boolean authenticatePassword(String password) {
		return authenticatePasswordInternal(password);
	}
}
